'use strict';

const { Shell, Gio, Meta, Clutter, GLib } = imports.gi;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utilities;

const EXT_PATH = Me.dir.get_path();
const PY_CMD_PATH = `${EXT_PATH}/script.py`;


class Extension {
    constructor() {
    }

    enable() {
        this.background_settings = new Gio.Settings({ schema: 'org.gnome.desktop.background' });

        if (Main.layoutManager._startingUp)
            this.startup_complete_id = Main.layoutManager.connect('startup-complete', this.on_startup_complete.bind(this));
        else
            this.on_startup_complete();
    }

    on_startup_complete() {
        this.background_changed_id = this.background_settings.connect('changed', () => {
            Utils.setTimeout(this.update_color.bind(this), 100);
            Utils.setTimeout(this.update_color.bind(this), 250);
            Utils.setTimeout(this.update_color.bind(this), 500);
        });
        this.update_color();
        this.remove_panel_corners();
        this.connect_panel_hide();
    }

    // hide panel background in overview not to overlap appfolder view
    connect_panel_hide() {
        this.appdisplay_show_id = Main.overview._overview._controls._appDisplay.connect('show', () => {
            this.set_panel_opacity(0);
        })
        this.appdisplay_hide_id = Main.overview._overview._controls._appDisplay.connect('hide', () => {
            this.set_panel_opacity(255);
        })
        this.overview_hide_id = Main.overview.connect('hiding', () => {
            this.set_panel_opacity(255);
        })
    }

    disconnect_panel_hide() {
        try {
            Main.overview._overview._controls._appDisplay.disconnect(this.appdisplay_show_id);
            Main.overview._overview._controls._appDisplay.disconnect(this.appdisplay_hide_id);
            Main.overview.disconnect(this.panel_hide_id);
        } catch (e) { }
    }

    set_panel_opacity(opacity) {
        let c = Main.panel.get_background_color();
        c.alpha = opacity;
        Main.panel.set_background_color(c);
    }

    remove_panel_corners() {
        Main.panel._leftCorner.hide();
        Main.panel._rightCorner.hide();
    }

    reset_panel_corners() {
        Main.panel._leftCorner.show();
        Main.panel._rightCorner.show();
    }

    update_color() {
        try {
            var wallpaper_path = Main.layoutManager._backgroundGroup.get_child_at_index(0).get_content().background._file.get_path();
        } catch (e) {
            this._log(`could not find wallpaper path: \n${e} `);
            return
        }

        Utils.spawnCommandLineAsync(`python ${PY_CMD_PATH} ${wallpaper_path}`,
            (ok, stdout, stderr, status) => {
                if (ok) {
                    if (status == 0) {
                        this.set_color_from(stdout);
                    }
                    else
                        this._log(`error in python script: \n${stderr}`);
                } else
                    this._log(`error calling python script: \n${stderr}`);
            }
        );
    }

    set_color_from(output) {
        let color_parse = Clutter.color_from_string(output.toString());

        if (!color_parse[0]) {
            this._log(`could not parse color ${output.toString()}`);
            return
        }

        let color = this.transform_color(color_parse[1].to_hls());

        this.apply_color(color);
    }

    bg_color(color) {
        return `background-color:${color};`
    }

    apply_color(color) {
        // 0: colors definitions
        let color_str = color.to_string().slice(0, -2);
        let lighter_color = color.lighten();
        let lighter_color_str = lighter_color.to_string().slice(0, -2);

        // 1: overview
        Main.overview._overview.set_style(this.bg_color(color_str));

        // 2: panel
        Main.panel.set_background_color(color.copy());

        // 3: dash
        Main.overview.dash._background.set_style(this.bg_color(lighter_color_str));

        // 4: appfolders
        if (Main.overview._overview.controls._appDisplay._folderIcons.length > 0) {
            this.apply_to_appfolders(color_str, lighter_color_str);
        }
        // re-apply if anything changed
        if (this.appfolder_icons_id)
            Main.overview._overview.controls._appDisplay.disconnect(this.appfolder_icons_id);
        this.appfolder_icons_id = Main.overview._overview.controls._appDisplay.connect('view-loaded', () => {
            this.apply_to_appfolders(color_str, lighter_color_str);
        })

        // 5: panel menus
        Main.panel.get_children().forEach(side => {
            side.get_children().forEach(button => {
                try {
                    button.get_child_at_index(0).menu.box.set_style(this.bg_color(lighter_color_str) + "border-radius:12px;");
                } catch (e) { }
            });
        });
    }

    apply_to_appfolders(color, lighter_color) {
        Main.overview._overview.controls._appDisplay._folderIcons.forEach(icon => {
            // for the icon
            icon.set_style(this.bg_color(lighter_color));

            // for the dialog
            icon._ensureFolderDialog();
            icon._dialog._viewBox.set_style(this.bg_color(color));
        });
    }

    transform_color([hue, lightness, saturation]) {
        let h = hue
        let l = Math.max(0.12, Math.min(0.2, 0.15 + (lightness - 0.4) / 5))
        let s = saturation / 2.7

        let color = Clutter.color_from_hls(h, l, s);
        color.alpha = 255;

        return color
    }

    disable() {
        this.background_settings.disconnect(this.background_changed_id);
        Main.layoutManager.disconnect(this.startup_complete_id);
        Main.overview._overview.controls._appDisplay.disconnect(this.appfolder_icons_id);

        Main.overview._overview.set_style(null);
        Main.panel.set_background_color(null);
        Main.overview.dash._background.set_style(null);
        Main.overview._overview.controls._appDisplay._folderIcons.forEach(icon => {
            icon.set_style(null);
            icon._dialog._viewBox.set_style(null);
        });
        Main.panel.get_children().forEach(side => {
            side.get_children().forEach(button => {
                try {
                    button.get_child_at_index(0).menu.box.set_style(null);
                } catch (e) { }
            });
        });

        this.reset_panel_corners();
        this.disconnect_panel_hide();

        delete this.background_settings;
        delete this.startup_complete_id;
        delete this.background_changed_id;
        delete this.appfolder_icons_id;
    }

    _log(str) {
        log(`[Dominant color] ${str} `);
    }
}

function init() {
    return new Extension();
}

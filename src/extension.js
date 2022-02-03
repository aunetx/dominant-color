'use strict';

const Gio = imports.gi.Gio;
const Main = imports.ui.main;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const StylesheetManager = Me.imports.stylesheet_manager;
const ColorManager = Me.imports.color_manager;
const Utils = Me.imports.utilities;

const BackgroundSettings = new Gio.Settings({
    schema: 'org.gnome.desktop.background'
});


class Extension {
    constructor() {
        this.stylesheet_manager = new StylesheetManager.StylesheetManager;
        this.color_manager = new ColorManager.ColorManager;
    }

    enable() {
        this.background_changed_id = BackgroundSettings.connect(
            'changed',
            _ => {
                Utils.setTimeout(
                    this.color_manager.update_color.bind(this.color_manager),
                    350
                );
            }
        );

        if (Main.layoutManager._startingUp)
            this.startup_complete_id = Main.layoutManager.connect(
                'startup-complete',
                this.color_manager.update_color.bind(this.color_manager)
            );
        else
            this.update();

        this.color_manager.connect(
            'color-changed',
            this.update.bind(this)
        );
    }

    update() {
        let color = this.color_manager.color_str;

        this.stylesheet_manager.create_stylesheet_for(color);
        this.stylesheet_manager.load_stylesheet();
    }

    disable() {
        BackgroundSettings.disconnect(this.background_changed_id);
        if (this.startup_complete_id)
            Main.layoutManager.disconnect(this.startup_complete_id);
    }

    _log(str) {
        log(`[Dominant color] ${str}`);
    }
}

function init() {
    return new Extension();
}

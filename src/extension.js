import Gio from 'gi://Gio';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import { StylesheetManager } from './stylesheet_manager.js';
import { ColorManager } from './color_manager.js';

const BackgroundSettings = new Gio.Settings({
    schema: 'org.gnome.desktop.background'
});


export default class DominantColor extends Extension {
    enable() {
        global.dominant_color = this;

        this.stylesheet_manager = new StylesheetManager(this.dir);
        this.color_manager = new ColorManager;

        this.background_changed_id = BackgroundSettings.connect(
            'changed',
            _ => {
                setTimeout(
                    this.color_manager.update_color.bind(this.color_manager),
                    350
                );
            }
        );

        this.color_manager.connect(
            'color-changed',
            this.update.bind(this)
        );

        if (Main.layoutManager._startingUp)
            this.startup_complete_id = Main.layoutManager.connect(
                'startup-complete',
                this.color_manager.update_color.bind(this.color_manager)
            );
        else
            this.color_manager.update_color();
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
        console.log(`[Dominant color] ${str}`);
    }
}

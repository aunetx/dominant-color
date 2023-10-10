import Gio from 'gi://Gio';
import St from 'gi://St';

const ThemeContext = St.ThemeContext;

export const StylesheetManager = class StylesheetManager {
    constructor(dir) {
        this.dir = dir;
        this.stylesheet_file = null;
    }

    load_stylesheet() {
        if (this.stylesheet_file)
            this.unload_stylesheet();

        let theme = ThemeContext.get_for_stage(global.stage).get_theme();
        this.stylesheet_file = this.dir.get_child("_style.css");
        theme.load_stylesheet(this.stylesheet_file);
    }

    unload_stylesheet() {
        if (this.stylesheet_file) {
            let theme = ThemeContext.get_for_stage(global.stage).get_theme();
            theme.unload_stylesheet(this.stylesheet_file);

            this.stylesheet_file = null;
        }
    }

    create_stylesheet_for(color) {
        let content = `
        #panel, #overview {
            background-color: ${color} !important;
        }
        `;

        let file = Gio.file_new_for_path(`${this.dir.get_path()}/_style.css`);
        file.replace_contents(content, '', false, '', null);
    }

    _log(str) {
        console.log(`[Dominant color] ${str}`);
    }
};

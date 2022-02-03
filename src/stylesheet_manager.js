'use strict';

const { Gio, St } = imports.gi;
const ThemeContext = St.ThemeContext;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utilities;

const EXT_PATH = Me.dir.get_path();
const STYLESHEET_PATH = `${EXT_PATH}/_style.css`;


var StylesheetManager = class StylesheetManager {
    constructor() {
        this.stylesheet_file = null;
    }

    load_stylesheet() {
        if (this.stylesheet_file)
            this.unload_stylesheet();

        let theme = ThemeContext.get_for_stage(global.stage).get_theme();
        this.stylesheet_file = Me.dir.get_child(STYLESHEET_PATH);
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

        let file = Gio.file_new_for_path(STYLESHEET_PATH);
        file.replace_contents(content, '', false, '', null);
    }

    _log(str) {
        log(`[Dominant color] ${str}`);
    }
};

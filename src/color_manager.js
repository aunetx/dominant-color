'use strict';

const Clutter = imports.gi.Clutter;
const Main = imports.ui.main;
const Signals = imports.signals;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Utils = Me.imports.utilities;

const EXT_PATH = Me.dir.get_path();
const PY_CMD_PATH = `${EXT_PATH}/script.py`;


var ColorManager = class ColorManager {
    constructor() {
        this.original_color = null;
        this.color = null;
    }

    update_color() {
        let wall = Main.layoutManager._backgroundGroup.get_child_at_index(0);

        if (!wall) {
            this._log(`could not get wallpaper`);
            return;
        }

        let wall_path = wall.get_content().background._file.get_path();

        Utils.spawnCommandLineAsync(`python ${PY_CMD_PATH} ${wall_path}`,
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
            return;
        }

        this.original_color = color_parse[1];
        this.color = this.transform_color(this.original_color.to_hls());

        this.emit('color-changed', true);
    }

    get color_str() {
        return this.color.to_string().slice(0, -2);
    }

    transform_color([hue, lightness, saturation]) {
        let h = hue;
        let l = Math.max(0.12, Math.min(0.2, 0.15 + (lightness - 0.4) / 5));
        let s = saturation / 2.7;

        let color = Clutter.color_from_hls(h, l, s);
        color.alpha = 255;

        return color;
    }

    _log(str) {
        log(`[Dominant color] ${str}`);
    }
};

Signals.addSignalMethods(ColorManager.prototype);

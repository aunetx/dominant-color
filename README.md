# dominant-color

A gnome-shell extension to set overview and panel background color to wallpaper's primary color.

*NB: this extension is currently only made as a design test, most importantly for https://gitlab.gnome.org/Teams/Design/whiteboards/-/issues/21. It contains bugs, but fixing side issues is for the moment not intended, as I try to adjust the design for the best before removing bugs and pushing it to https://extensions.gnome.org.*

## Installation

You will need `python3` along with python's `PIL`, which you can install with `pip install pillow`.

You can install the extension locally with:

```sh
make install
```

You can build a pkg with

```sh
make pkg
```

Don't forget to reload the shell after installing, and to enable the extension.

## Screenshots

Normal wallpaper 1:

![Capture d’écran de 2021-12-02 09-36-02](https://user-images.githubusercontent.com/31563930/144387241-831881fe-a317-48d1-9e39-7259f574024d.png)

Normal wallpaper 2:

![Capture d’écran de 2021-12-02 09-36-16](https://user-images.githubusercontent.com/31563930/144387245-d0d895a6-11d7-4398-8260-77e6a18b9e8b.png)

Very bright wallpaper:

![Capture d’écran de 2021-12-02 09-36-26](https://user-images.githubusercontent.com/31563930/144387250-a6599476-7aab-420a-884b-1588c172553b.png)

Very dark wallpaper:

![Capture d’écran de 2021-12-02 09-36-32](https://user-images.githubusercontent.com/31563930/144387256-b6b95a14-3b95-4e52-b8f8-ca428f6b149a.png)

## Customization

You can test changing the colour settings by changing the `transform_color` in `src/extension.js`.

It currently keeps the same hue (`h = hue`), makes the lightness quite dark (`l = Math.max(0.12, Math.min(0.2, 0.15 + (lightness - 0.4) / 5))`, so it keeps it between 0.12 and 0.20, and tries to adjust it to still have darker wallpaper making darker grey), and remove some saturation (`s = saturation / 2.7`).

The best thing to tweak here probably is for the saturation, and maybe adjusting it with the lightness too would be good (for example `s = saturation / ((7*lightness) + 0.1)` is quite good, but has some problems with very dark/light wallpapers.

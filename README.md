# Mixery CLI tool
_Command-line tool for advanced users_

> As of 30th June 2023 (or June 30th if you're American), the only way to get Mixery DAW is by building it yourself. The content below was created for future version of Mixery, so if you saw something like "you should use prebuilt Mixery", please ignore that for now.

## Do you need this?
If you just want to _try_ Mixery: No. We've built a standard Mixery DAW, which can be accessed [here][Mixery App].

If you want to run Mixery with addons: Also no. Mixery in your browser can load addons from given URL, ~~Tarball or Zip file~~ (these will be implemented at later date). Simply drag and drop those files to your DAW and the addon will be installed and loaded.

If you want to configure Mixery, make addons or you think CLI is cool then this CLI tool is for you.

## Using CLI tool
### Subcommands
> Typing ``mixerycli`` alone will display all available subcommands. Typing ``mixerycli new`` will show all subcommands under ``new`` subcommand.

- ``new``: Create new.
  + ``configuration``: Create new Mixery configuration.
  + ``addon``: Create new Mixery addon.
- ``build``: Build configuration/addon in target directory.

### Options
You can specify options by using one of these formats:

- ``--option-name value`` or ``-option-name value``
- ``--option-name=value`` or ``-option-name=value``

### Global options
- ``string: target-dir``: The directory that you want to use with this CLI tool.
- ``string: package-link``: A ``key:value`` pair, where ``key`` is the name of package and ``value`` is the path to the local package that you want to use (instead of packages from npm registry).

### ``build`` options
- ``boolean: clean``: Remove ``build/`` before build.
- ``boolean: partial-build``: Generate files but don't build the DAW. Only applies to ``configuration`` project type.

## What are "configurations"?
Although Mixery can be used out of the box without building (by visiting [https://mixeryoss.github.io/app][Mixery App]), some people wanted to customize their Mixery at its core (such as swapping Mixery Engine with its fork or adding/removing default addons) or help developing Mixery.

To handle the build process, we use something called "build configurations". These configurations can be created by using ``mixerycli new cofiguration`` and can be configurated by editing ``mixery.json``. A typical ``mixery.json`` that we use for development look like this:

```json
{
    "type": "configuration",
    "links": {
        "@mixery/engine": "../engine",
        "@mixery/uikit": "../uikit"
    }
}
```

Here, we used ``"links"`` to link our local package (a.k.a packages in development) to generated npm module (which is generated in ``build/``).

> Configuration created from ``mixerycli`` does _not_ contains "Mixery Essentials". If you want, you can clone [MixeryOSS/essentials](https://github.com/MixeryOSS/essentials) into ``addons/`` directory. See next section for details.

### Default addons
When you create a new configuration, ``mixerycli`` will creates a new ``addons/`` directory. You can create new addon by using ``mixerycli new addon --target-dir=addons/addonid``, or clone addon's Git repository into ``addons/`` to add it as default addon.

After that, use ``mixerycli build`` to build both addons and DAW, which allows you to test addons or create your own "Mixery distribution" with a custom set of default addons.

[Mixery App]: https://mixeryoss.github.io/app
# -*- coding: utf-8 -*-
try:
    from setuptools import setup, find_packages
except ImportError:
    from ez_setup import use_setuptools
    use_setuptools()
    from setuptools import setup, find_packages

from draughtcraft import __version__

setup(
    name = 'draughtcraft',
    version = __version__,
    description = '',
    author = '',
    author_email = '',
    install_requires = [
        "pecan",
        "elixir",
        "beaker",
        "formencode",
        "webhelpers",
        "webflash",
        "simplejson",
        "python-postmark",
        "pytest-xdist",
        "pytest-cov",
        "fudge"
    ],
    zip_safe = False,
    paster_plugins = ['Pecan'],
    include_package_data = True,
    packages = find_packages(exclude=['ez_setup'])
)

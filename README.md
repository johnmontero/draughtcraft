Recipe builder and community app for homebrewing enthusiasts.

Building and Starting the Application
====================================
Draughtcraft runs on PostgreSQL.  Before you run it locally, you'll want to
create a local database.  The name configured by default is `draughtcraftdev`:

    $ createdb draughtcraftdev

    $ python setup.py develop
    $ python draughtcraft/data/tools/populate.py ./development.py
    $ pecan serve ./development.py

Running the Tests
====================================
    $ createdb draughtcrafttest
    $ py.test

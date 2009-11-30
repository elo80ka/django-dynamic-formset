=========================
Installation instructions
=========================

There are two ways to install this application for use by your
projects; the first is to do a Subversion checkout::

    svn co http://django-dynamic-formset.googlecode.com/svn/trunk/ django-dynamic-formset

The second method is to download a packaged release. The latest
release is 1.1. You can download the source and documentation only,
or include the demo project::

    wget http://django-dynamic-formset.googlecode.com/files/jquery.formset-1.1.zip
    unzip jquery.formset-1.1.zip -d jquery.formset-1.1
    cd jquery.formset-1.1

The plugin files are in the ``src/`` directory. If you downloaded
the archive with the demo project, you'll need to set it up first.


Setting up the demo project
===========================

The demo project is a Django project, showing different ways to
use the plugin. To run the project, you'll need Python_ and Django_.
For instructions on installing them, see their respective sites.

You'll also need PySQLite_ - if you've got Python 2.5 and above, this
is already included in the standard library.

Once you've set up Django, run the following commands to set up the
database and start the development server::

    cd demo
    python ./manage.py syncdb
    python ./manage.py runserver

You can now browse to ``http://localhost:8000/`` and view the examples.

.. _Python: http://python.org/
.. _Django: http://www.djangoproject.com/
.. _PySQLite: http://oss.itsystementwicklung.de/trac/pysqlite

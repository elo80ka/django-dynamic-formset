import django
from django.conf import settings
from django.conf.urls.defaults import *
from django.contrib import admin
from django.views.generic.simple import direct_to_template

major, minor = django.VERSION[:2]
is_pre12 = (major <= 1 and minor < 2)

urlpatterns = patterns('',
    (r'^$', direct_to_template, {'template': 'index.html', 'extra_context': dict(is_pre12=is_pre12)}),
    (r'^examples/', include('example.urls')),
)

try:
    import ajax_select
    # If django-ajax-selects is installed, include its URLs:
    urlpatterns += patterns('',
        (r'^ajax-select/', include('ajax_select.urls'))
    )
except ImportError:
    pass

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^%s/(?P<path>.*)$' % settings.MEDIA_URL[1:-1],
         'django.views.static.serve',
         {'document_root':  settings.MEDIA_ROOT, 'show_indexes': False}),
    )

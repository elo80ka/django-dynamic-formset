import django
from django.conf import settings
from django.contrib import admin
from django.views.generic import TemplateView
from django.conf.urls import patterns, url, include


urlpatterns = patterns('',
    url(r'^$', TemplateView.as_view(template_name='index.html')),
    url(r'^examples/', include('example.urls')),
)

try:
    import ajax_select
    # If django-ajax-selects is installed, include its URLs:
    urlpatterns += patterns('',
        url(r'^ajax-select/', include('ajax_select.urls'))
    )
except ImportError:
    pass

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^%s/(?P<path>.*)$' % settings.MEDIA_URL[1:-1],
         'django.views.static.serve',
         {'document_root':  settings.MEDIA_ROOT, 'show_indexes': False}),
    )

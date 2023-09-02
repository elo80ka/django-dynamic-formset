import django
from django.conf import settings
from django.conf.urls import include, url
from django.contrib import admin
from django.views.generic import TemplateView
from django.views.static import serve

urlpatterns = [
    url(r'^$', TemplateView.as_view(template_name='index.html')),
    url(r'^examples/', include('example.urls')),
]

try:
    import ajax_select
    # If django-ajax-selects is installed, include its URLs:
    urlpatterns += [
        url(r'^ajax-select/', include('ajax_select.urls')),
    ]
except ImportError:
    pass

if settings.DEBUG:
    urlpatterns += [
        url(r'^%s/(?P<path>.*)$' % settings.MEDIA_URL[1:-1],
         serve,
         {'document_root':  settings.MEDIA_ROOT, 'show_indexes': False}),
    ]

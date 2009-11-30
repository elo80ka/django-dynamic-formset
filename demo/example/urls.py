from django.conf.urls.defaults import *
from example.forms import AutoCompleteOrderedItemForm, OrderedItemForm, ContactFormset, EventFormset

urlpatterns = patterns('example.views',
    url(r'^stacked/$', 'formset', {'formset_class': ContactFormset, 'template': 'example/formset-stacked.html'}, name='example_stacked'),
    url(r'^table/$', 'formset', {'formset_class': ContactFormset, 'template': 'example/formset-table.html'}, name='example_table'),
    url(r'^admin-widget/$', 'formset', {'formset_class': EventFormset, 'template': 'example/formset-admin-widget.html'}, name='example_admin_widget'),
    url(r'^multiple-formsets/$', 'multiple_formsets', {'template': 'example/formset-multiple-formsets.html'}, name='example_multiple_formsets'),
    url(r'^inline-formset/$', 'inline_formset',
       {'form_class': OrderedItemForm, 'template': 'example/inline-formset.html'}, name='example_inline_formset'),
    url(r'^inline-formset-autocomplete/$', 'inline_formset',
       {'form_class': AutoCompleteOrderedItemForm, 'template': 'example/inline-formset-autocomplete.html'}, name='example_inline_autocomplete'),
    url(r'^autocomplete-products/$', 'autocomplete_products', name='example_autocomplete_products')
)

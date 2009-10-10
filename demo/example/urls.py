from django.conf.urls.defaults import *
from example.forms import AutoCompleteOrderedItemForm, OrderedItemForm

urlpatterns = patterns('example.views',
    url(r'^stacked/$', 'formset', {'template': 'example/formset-stacked.html'}, name='example_stacked'),
    url(r'^table/$', 'formset', {'template': 'example/formset-table.html'}, name='example_table'),
    url(r'^inline-formset/$', 'inline_formset',
       {'form_class': OrderedItemForm, 'template': 'example/inline-formset.html'}, name='example_inline_formset'),
    url(r'^inline-formset-autocomplete/$', 'inline_formset',
       {'form_class': AutoCompleteOrderedItemForm, 'template': 'example/inline-formset-autocomplete.html'}, name='example_inline_autocomplete'),
    url(r'^autocomplete-products/$', 'autocomplete_products', name='example_autocomplete_products')
)

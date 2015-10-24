
from django.conf.urls import patterns, url, include
from example.forms import AutoCompleteOrderedItemForm, OrderedItemForm, ContactFormset, MaxFiveContactsFormset, EmptyContactFormset, EventFormset
from example.forms import AutoCompleteSelectFieldForm

urlpatterns = patterns('example.views',
    url(r'^stacked/$', 'formset', {'formset_class': ContactFormset, 'template': 'example/formset-stacked.html'}, name='example_stacked'),
    url(r'^table/$', 'formset', {'formset_class': ContactFormset, 'template': 'example/formset-table.html'}, name='example_table'),
    url(r'^form-template/$', 'formset_with_template', {'formset_class': EmptyContactFormset, 'template': 'example/form-template.html'}, name='example_form_template'),
    url(r'^admin-widget/$', 'formset', {'formset_class': EventFormset, 'template': 'example/formset-admin-widget.html'}, name='example_admin_widget'),
    url(r'^multiple-formsets/$', 'multiple_formsets', {'template': 'example/formset-multiple-formsets.html'}, name='example_multiple_formsets'),
    url(r'^inline-formset/$', 'inline_formset',
       {'form_class': OrderedItemForm, 'template': 'example/inline-formset.html'}, name='example_inline_formset'),
    url(r'^inline-formset-autocomplete/$', 'inline_formset',
       {'form_class': AutoCompleteOrderedItemForm, 'template': 'example/inline-formset-autocomplete.html'}, name='example_inline_autocomplete'),
    url(r'^inline-formset-ajax-selects/$', 'inline_formset',
       {'form_class': AutoCompleteSelectFieldForm, 'template': 'example/inline-formset-django-ajax-select.html'}, name='example_inline_ajax_selects'),
    url(r'^autocomplete-products/$', 'autocomplete_products', name='example_autocomplete_products')
)

import django
major, minor = django.VERSION[:2]
if major >= 1 and minor >= 2:
    # These examples require Django 1.2 and above:
    urlpatterns += patterns('example.views',
        url(r'^max-forms/$', 'formset', {'formset_class': MaxFiveContactsFormset, 'template': 'example/max-forms.html'}, name='example_max_forms'),
        url(r'^empty-form/$', 'formset', {'formset_class': EmptyContactFormset, 'template': 'example/empty-form.html'}, name='example_empty_form'),
    )

if major >=1 and minor >= 7:
    from example.forms import MinTwoContactsFormset
    # These examples require Django 1.7 and above:
    urlpatterns += patterns('example.views',
        url(r'^min-forms/$', 'formset', {'formset_class': MinTwoContactsFormset, 'template': 'example/min-forms.html'}, name='example_min_forms'),
    )
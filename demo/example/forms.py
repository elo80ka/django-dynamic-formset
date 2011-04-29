from django import forms
from django.forms import fields, models, formsets, widgets
from django.contrib.admin.widgets import AdminDateWidget
from django.conf import settings
from example.models import Product, Order, OrderedItem

############################
## Inline Formset Example ##
############################

class OrderForm(models.ModelForm):
    class Meta:
        model = Order

class OrderedItemForm(models.ModelForm):
    class Meta:
        model = OrderedItem

class AutoCompleteOrderedItemForm(models.ModelForm):
    """
    Display the Ordered Item form with an autocomplete textbox for the
    Products instead of the Dropdown List.
    """

    class Meta:
        model = OrderedItem

    class Media:
        js = ('js/jquery.autocomplete.min.js', 'js/autocomplete-init.js',)
        css = {
            'all': ('css/jquery.autocomplete.css',),
        }

    def __init__(self, *args, **kwargs):
        super(AutoCompleteOrderedItemForm, self).__init__(*args, **kwargs)
        self.fields['product'].widget = widgets.TextInput(attrs={'class': 'autocomplete-me'})

def get_ordereditem_formset(form, formset=models.BaseInlineFormSet, **kwargs):
    return models.inlineformset_factory(Order, OrderedItem, form, formset, **kwargs)

################################
## Plain 'ole Formset example ##
################################

CONTACT_INFO_TYPES = (
    ('Phone', 'Phone'),
    ('Fax', 'Fax'),
    ('Email', 'Email'),
    ('AIM', 'AIM'),
    ('Gtalk', 'Gtalk/Jabber'),
    ('Yahoo', 'Yahoo'),
)

class ContactInfoForm(forms.Form):
    type = fields.ChoiceField(choices=CONTACT_INFO_TYPES)
    value = fields.CharField(max_length=200)
    preferred = fields.BooleanField(required=False)

ContactFormset = formsets.formset_factory(ContactInfoForm)
# Define a formset, which will allow a maximum of 5 contacts, no more:
MaxFiveContactsFormset = formsets.formset_factory(ContactInfoForm, extra=5, max_num=5)
# Define the same formset, with no forms (so we can demo the form template):
EmptyContactFormset = formsets.formset_factory(ContactInfoForm, extra=0)

###############################################
## Plain 'ole Formset with Javascript Widget ##
###############################################

class EventForm(forms.Form):
    name = fields.CharField(max_length=150, label='display name')
    start_date = fields.DateField(widget=AdminDateWidget)
    end_date = fields.DateField(widget=AdminDateWidget)

    def _get_media(self):
        # The "core.js" file is required by the Admin Date widget, yet for
        # some reason, isn't included in the widgets media definition.
        # We override "_get_media" because core.js needs to appear BEFORE
        # the widget's JS files, and the default order puts the form's
        # media AFTER that of its fields.
        media = widgets.Media(
            js=('%sjs/core.js' % settings.ADMIN_MEDIA_PREFIX,)
        )
        media += super(EventForm, self)._get_media()
        return media
    media = property(_get_media)

EventFormset = formsets.formset_factory(EventForm, extra=2)

##############################
## Using Django-ajax-select ##
##############################

from ajax_select.fields import AutoCompleteSelectField

class AutoCompleteSelectFieldForm(models.ModelForm):
    """
    Use the `AutoCompleteSelectField` to replace the default select field.
    """
    
    product = AutoCompleteSelectField('product')
    
    class Meta:
        model = OrderedItem

    class Media:
        js = ('js/jquery.autocomplete.min.js',)
        css = {
            'all': ('css/jquery.autocomplete.css',),
        }

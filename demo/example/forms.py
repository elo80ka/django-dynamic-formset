from django import forms
from django.forms import fields, models, formsets, widgets
from example.models import Product, Order, OrderedItem

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

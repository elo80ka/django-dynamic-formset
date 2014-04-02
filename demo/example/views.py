from django.http import HttpResponse
from django.shortcuts import render_to_response, redirect
from django.template.context import RequestContext
from example.forms import ContactFormset, EventFormset, Order, OrderForm, get_ordereditem_formset
from example.forms import AutoCompleteSelectFieldForm
from example.models import Order, Product

def autocomplete_products(request):
    q = request.GET.get('q', '')
    products = Product.objects.filter(name__icontains=q).values_list('pk', 'name')
    output = u'\n'.join([u'%d|%s' % tuple(product) for product in products])
    return HttpResponse(output, mimetype='text/plain')

def display_data(request, data, **kwargs):
    return render_to_response('example/posted-data.html', dict(data=data, **kwargs),
        context_instance=RequestContext(request))

def formset(request, formset_class, template):
    if request.method == 'POST':
        formset = formset_class(request.POST)
        if formset.is_valid():
            data = formset.cleaned_data
            return display_data(request, data)
    else:
        formset = formset_class()
    return render_to_response(template, {'formset': formset},
        context_instance=RequestContext(request))

def formset_with_template(request, formset_class, template):
    # If you're using a Django version older than 1.2, you won't have `formset.empty_form`;
    # You can create your own "empty form" instance, and even initialize it with default data.
    # Make sure to set the prefix as shown, so things work as expected:
    formset = formset_class()
    form = formset.form(
        prefix='%s-__prefix__' % formset.prefix,
        initial={
            'type': 'Email',
            'value': 'john.Q@public.net'})
    if request.method == 'POST':
        formset = formset_class(request.POST)
        if formset.is_valid():
            data = formset.cleaned_data
            return display_data(request, data)
    return render_to_response(template, {'form': form, 'formset': formset},
        context_instance=RequestContext(request))

def inline_formset(request, form_class, template):
    OrderedItemFormset = get_ordereditem_formset(form_class, extra=1, can_delete=True)
    order = Order.objects.all()[0]
    if request.method == 'POST':
        form = OrderForm(request.POST, instance=order)
        formset = OrderedItemFormset(request.POST, instance=order)
        if form.is_valid() and formset.is_valid():
            form.save()
            formset.save()
            data = [{
                'order': item.order,
                'product': item.product,
                'quantity': item.quantity
            } for item in order.ordered_items.all()]
            return display_data(request, data)
    else:
        form = OrderForm(instance=order)
        formset = OrderedItemFormset(instance=order)
    return render_to_response(template, {'form': form, 'formset': formset},
        context_instance=RequestContext(request))

def multiple_formsets(request, template):
    if request.method == 'POST':
        contact_formset, event_formset = ContactFormset(request.POST, prefix='contact_form'), EventFormset(request.POST, prefix='event_form')
        if contact_formset.is_valid() and event_formset.is_valid():
            data = [contact_formset.cleaned_data, event_formset.cleaned_data]
            return display_data(request, data, multiple_formsets=True)
    else:
        contact_formset, event_formset = ContactFormset(prefix='contact_form'), EventFormset(prefix='event_form')
    return render_to_response(template, {'contact_formset': contact_formset, 'event_formset': event_formset},
        context_instance=RequestContext(request))

from django.http import HttpResponse
from django.shortcuts import render_to_response
from django.template.context import RequestContext
from example.forms import ContactFormset, Order, OrderForm, get_ordereditem_formset
from example.models import Order, Product

def autocomplete_products(request):
    q = request.GET.get('q', '')
    products = Product.objects.filter(name__icontains=q).values_list('pk', 'name')
    output = u'\n'.join([u'%d|%s' % tuple(product) for product in products])
    return HttpResponse(output, mimetype='text/plain')

def display_data(request, data):
    return render_to_response('example/posted-data.html', {'data': data},
        context_instance=RequestContext(request))

def formset(request, template):
    if request.method == 'POST':
        formset = ContactFormset(request.POST)
        if formset.is_valid():
            data = formset.cleaned_data
            return display_data(request, data)
    else:
        formset = ContactFormset()
    return render_to_response(template, {'formset': formset},
        context_instance=RequestContext(request))

def inline_formset(request, form_class, template):
    OrderedItemFormset = get_ordereditem_formset(form_class, extra=1)
    if request.method == 'POST':
        form = OrderForm(request.POST)
        formset = OrderedItemFormset(request.POST)
        if form.is_valid() and formset.is_valid():
            data = formset.cleaned_data
            return display_data(request, data)
    else:
        form = OrderForm()
        formset = OrderedItemFormset()
    return render_to_response(template, {'form': form, 'formset': formset},
        context_instance=RequestContext(request))

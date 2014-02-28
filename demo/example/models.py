
# Test with inlineformsets and inlinemodelformsets
# Test with fieldsets (admin)?

from django.db import models
from django.template.defaultfilters import pluralize
from datetime import date

class Product(models.Model):
    name = models.CharField(max_length=150)

    class Meta:
        ordering = ('name',)

    def __unicode__(self):
        return self.name

class Order(models.Model):
    customer = models.CharField(max_length=150)
    date = models.DateField(default=date.today, editable=False)

    def __unicode__(self):
        return u"%s's order" % self.customer

class OrderedItem(models.Model):
    order = models.ForeignKey(Order, related_name='ordered_items')
    product = models.ForeignKey(Product, related_name='orders')
    quantity = models.PositiveSmallIntegerField()

    def __unicode__(self):
        return u"%s (%d)" % (self.product, self.quantity)

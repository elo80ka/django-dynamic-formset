(function($) {
    module('Basic Formset Tests');

    test('Test Default Options', function (assert) {
        assert.equal($.fn.formset.defaults.prefix, 'form', 'prefix: form');
        assert.equal($.fn.formset.defaults.formTemplate, null, 'formTemplate: null');
        assert.equal($.fn.formset.defaults.addText, 'add another', 'addText: "add another"');
        assert.equal($.fn.formset.defaults.deleteText, 'remove', 'deleteText: "remove"');
        assert.equal($.fn.formset.defaults.addCssClass, 'add-row', 'addCssClass: "add-row"');
        assert.equal($.fn.formset.defaults.deleteCssClass, 'delete-row', 'deleteCssClass: "delete-row"');
        assert.equal($.fn.formset.defaults.formCssClass, 'dynamic-form', 'formCssClass: "dynamic-form"');
        assert.deepEqual($.fn.formset.defaults.extraClasses, [], 'extraClasses: []');
        assert.equal($.fn.formset.defaults.keepFieldValues, '', 'keepFieldValues: ');
        assert.equal($.fn.formset.defaults.added, null, 'added callback: null');
        assert.equal($.fn.formset.defaults.removed, null, 'removed callback: null');
    });
    
    module('Basic Formset Tests', {
        setup: function () {
            $('#stacked-form div').formset({
                extraClasses: ['row1', 'row2', 'row3']
            });
        }
    });
    
    test('Test Formset Creation', function (assert) {
        assert.equal($('#stacked-form div').size(), 1, 'Default form is present.');
        assert.equal($('#stacked-form .delete-row').size(), 1, 'Delete button created.');
        assert.equal($('#stacked-form .add-row').size(), 1, 'Add button created.');
        assert.ok($('#stacked-form div:first').hasClass('dynamic-form'), 'FormCssClass added to forms.');
    });
    
    test('Test Form Addition', function (assert) {
        assert.equal($('#id_form-TOTAL_FORMS').val(), '1', 'Default form is present.');
        $('#stacked-form .add-row').trigger('click');
        assert.equal($('#id_form-TOTAL_FORMS').val(), '2', 'Updated "Total Forms" count.');
        assert.equal($('#stacked-form div').size(), 2, 'Added new form.');
    });
    
    test('Test Form Removal', function (assert) {
        assert.equal($('#id_form-TOTAL_FORMS').val(), '1', 'Default form is present.');
        $('#stacked-form .delete-row').trigger('click');
        assert.equal($('#id_form-TOTAL_FORMS').val(), '0', 'Updated "Total Forms" count.');
        assert.equal($('#stacked-form div').size(), 0, 'Removed form.');
    });
    
    test('Test Max Forms', function (assert) {
        var $totalForms = $('#id_form-TOTAL_FORMS'),
            $maxForms = $('#id_form-MAX_NUM_FORMS'),
            curCount = parseInt($totalForms.val(), 10),
            maxCount = parseInt($maxForms.val(), 10),
            $add = $('#stacked-form .add-row'), i;
        assert.ok(curCount < maxCount, 'Form count is less than maximum allowed.');
        assert.ok($add.is(':visible'), 'Add button is visible.');
        for (i = 1; i < maxCount; i += 1) {
            $add.trigger('click');
        }
        assert.equal($totalForms.val(), $maxForms.val(), 'Maximum number of forms added.');
        assert.ok($add.is(':hidden'), 'Add button is now hidden.');
        $('#stacked-form .delete-row:first').trigger('click');
        assert.ok(parseInt($totalForms.val(), 10) < maxCount, 'Form count is now less than max allowed.');
        assert.ok($add.is(':visible'), 'Add button is visible again.');
    });
    
    test('Test Cloned Form Element Name', function (assert) {
        var idRegex = /id_form-(\d+)-(\w+)/,
            nameRegex = /form-(\d+)-(\w+)/;
        assert.ok(idRegex.test($('#stacked-form .dynamic-form:first select').prev().attr('for')), 'Default label "for" ok.');
        assert.ok(idRegex.test($('#stacked-form .dynamic-form:first select').attr('id')), 'Default element id ok.');
        assert.ok(nameRegex.test($('#stacked-form .dynamic-form:first select').attr('name')), 'Default element name ok.');
        $('#stacked-form .add-row').trigger('click');
        assert.ok(idRegex.test($('#stacked-form .dynamic-form:last select').prev().attr('for')), 'Cloned element "for" matches default.');
        assert.ok(idRegex.test($('#stacked-form .dynamic-form:last select').attr('id')), 'Cloned element id matches default.');
        assert.ok(nameRegex.test($('#stacked-form .dynamic-form:last select').attr('name')), 'Cloned element name matches default.');
    });
    
    test('Test "extraClasses"', function (assert) {
        $('#stacked-form .add-row').trigger('click');
        $('#stacked-form .add-row').trigger('click');
        assert.equal($('#stacked-form div').size(), 3, '3 forms now present.');
        assert.ok($('#stacked-form div:eq(0)').hasClass('row1'), 'First form has class "row1" applied to it.');
        assert.ok($('#stacked-form div:eq(1)').hasClass('row2'), 'Second form has class "row2" applied to it.');
        assert.ok($('#stacked-form div:eq(2)').hasClass('row3'), 'Third form has class "row3" applied to it.');
    });
    
    test('Test Cloned Form SELECTs Without Blank OPTION Are Not Cleared', function (assert) {
        assert.equal($('#stacked-form .dynamic-form').size(), 1, 'One default form present.');
        assert.equal($('#stacked-form .dynamic-form:first select').val(), 'Email', 'Default SELECT element has value "Email".');
        $('#stacked-form .add-row').trigger('click');
        assert.equal($('#stacked-form .dynamic-form').size(), 2, 'Cloned form added.');
        assert.equal($('#stacked-form .dynamic-form:last select').val(), 'Email', 'Cloned SELECT element still has value "Email".');
    });
    
    test('Test Cloned Form INPUTs Are Cleared', function (assert) {
        assert.equal($('#stacked-form .dynamic-form').size(), 1, 'One default form present.');
        assert.equal($('#stacked-form .dynamic-form:first input:text').val(), 'me@example.com', 'Default INPUT element has value "me@example.com".');
        $('#stacked-form .add-row').trigger('click');
        assert.equal($('#stacked-form .dynamic-form').size(), 2, 'Cloned form added.');
        assert.ok(!$('#stacked-form .dynamic-form:last input:text').val(), 'Cloned INPUT element has no value.');
    });
    
    test('Test Cloned Form Checkboxes Are Unchecked', function (assert) {
        assert.equal($('#stacked-form .dynamic-form').size(), 1, 'One default form present.');
        assert.ok($('#stacked-form .dynamic-form:first input:checkbox').attr('checked'), 'Default Checkbox element is checked.');
        $('#stacked-form .add-row').trigger('click');
        assert.equal($('#stacked-form .dynamic-form').size(), 2, 'Cloned form added.');
        assert.ok(!$('#stacked-form .dynamic-form:last input:checkbox').attr('checked'), 'Cloned Checkbox element is unchecked.');
    });
    
    (function () {
        var addCallback, delCallback;
        
        module('Basic Formset Tests', {
            setup: function () {
                addCallback = new Mock();
                addCallback.calls(3).required(1);
                delCallback = new Mock();
                delCallback.calls(1).required(1);
                
                $('#stacked-form div').formset({
                    keepFieldValues: 'input:text',
                    added: addCallback,
                    removed: delCallback
                });
            }
        });
        
        test('Test Excluded Form Elements Are Ignored', function (assert) {
            assert.equal($('#stacked-form .dynamic-form').size(), 1, 'One default form present.');
            assert.equal($('#stacked-form .dynamic-form:first input:text').val(), 'me@example.com', 'Default INPUT element has value "me@example.com".');
            $('#stacked-form .add-row').trigger('click');
            assert.equal($('#stacked-form .dynamic-form').size(), 2, 'Cloned form added.');
            assert.equal($('#stacked-form .dynamic-form:last input:text').val(), 'me@example.com', 'Cloned INPUT element still has value "me@example.com".');
        });
        
        test('Test "added" callback called once, for each form added', function (assert) {
            var i;
            for (i = 0; i < 3; i += 1) {
                $('#stacked-form .add-row').trigger('click');
            }
            assert.ok(addCallback.verify(), '"Added" callback called 3 times, with a single argument.');
        });
        
        test('Test "removed" callback called once, for each form deleted', function (assert) {
            assert.equal($('#stacked-form .dynamic-form').size(), 1, 'One default form present.');
            assert.equal($('#stacked-form .dynamic-form:first .delete-row:visible').size(), 1, 'Default form has active delete button.');
            $('#stacked-form .dynamic-form:first .delete-row').trigger('click');
            assert.ok(delCallback.verify(), '"Removed" callback called once, with a single argument.');
        });
    }());
    
    
    module('Basic Formset Tests', {
        setup: function () {
            $('#stacked-form div').formset({
                addCssClass: 'btn btn-add',
                deleteCssClass: 'btn btn-danger'
            });
        }
    });
    
    test('Test Form Addition With Multiple AddCssClasses', function (assert) {
        var $btn = $('#stacked-form .btn-add');
        assert.equal($('#id_form-TOTAL_FORMS').val(), '1', 'Default form is present.');
        assert.ok($btn.hasClass('btn'), 'Add button has class "btn" applied to it.');
        assert.ok($btn.hasClass('btn-add'), 'Add button has class "btn-add" applied to it.');
        $btn.trigger('click');
        assert.equal($('#id_form-TOTAL_FORMS').val(), '2', 'Updated "Total Forms" count.');
        assert.equal($('#stacked-form div').size(), 2, 'Added new form.');
    });
    
    test('Test Form Removal With Multiple DeleteCssClasses', function (assert) {
        var $btn = $('#stacked-form .btn-danger');
        assert.equal($('#id_form-TOTAL_FORMS').val(), '1', 'Default form is present.');
        assert.ok($btn.hasClass('btn'), 'Remove button has class "btn" applied to it.');
        assert.ok($btn.hasClass('btn-danger'), 'Remove button has class "btn-danger" applied to it.');
        $btn.trigger('click');
        assert.equal($('#id_form-TOTAL_FORMS').val(), '0', 'Updated "Total Forms" count.');
        assert.equal($('#stacked-form div').size(), 0, 'Removed form.');
    });
}(jQuery));

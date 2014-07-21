Ink.requireModules(['Ink.UI.DatePicker_1', 'Ink.Dom.Css_1', 'Ink.Dom.Event_1', 'Ink.Dom.Element_1', 'Ink.Util.Array_1', 'Ink.UI.Calendar_1'], function (DatePicker, Css, InkEvent, InkElement, InkArray, Calendar) {

var body = document.body;
var dtElm;
var dt;

function mkDatePicker(options) {
    testWrapper = InkElement.create('div', { insertBottom: body });
    dtElm = InkElement.create('input', { type: 'text', insertBottom: testWrapper });
    dt = new DatePicker(dtElm, Ink.extendObj({
        startDate: '2000-10-10',
        format: 'dd/mm/yyyy'
    }, options));
}

module('main', {
    setup: function () {
        mkDatePicker({});
    },
    teardown: function () {
        InkElement.remove(testWrapper);
    }
});

test('has a calendar', function () {
    ok(dt._calendar instanceof Calendar);
    strictEqual(dt._calendar, dt.getCalendar());
});

test('puts the calendar next to the element', function () {
    strictEqual(dt.getElement().nextSibling, dt.getCalendar().getElement());
});

test('alias: setDate', function () {
    var spy = sinon.stub(dt._calendar, 'setDate');
    dt.setDate('2000-10-12');
    ok(spy.calledOnce);
    ok(spy.calledWith('2000-10-12'));
});

test('set', function () {
    // Because it had a bug
    var dt = Ink.Util.Date_1.set('Y-m-d', '2012-10-10');
    equal(dt.getFullYear(), 2012);
    equal(dt.getMonth(), 9);
    equal(dt.getDate(), 10);
});

test('show', function () {
    equal(Css.getStyle(dt._calendarEl, 'display'), 'none');
    dt.show();
    notEqual(Css.getStyle(dt._calendarEl, 'display'), 'none');
});

test('destroy', function () {
    ok(testWrapper.children.length > 1 || testWrapper.firstChild !== dtElm, 'sanity check. if this fails, review the test because you\'ve changed the DOM structure of this component');
    dt.destroy();
    equal(testWrapper.children.length, 1, 'destroyed remaining instances');
    strictEqual(testWrapper.firstChild, dtElm, 'the only element there is our original input');
});


});

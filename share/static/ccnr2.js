'use strict';
(function ($) {
    return {
        // (P)age type
        p: (function (_page) {
            $.each($('html').attr('class').split(/\s+/), function (index, value) {
                if (_page) return;
                value = value.split('-');
                if ('page' != value[0] || !value[1]) return;
                _page = value[1];
            });
            return _page || 'unknown';
        }()),
        // (S)tatable
        s: 'pushState' in history,
        // (W)hich key code
        w: 0,
        // handlers (O)n different pages
        _o: [],
        // (D)eferred object for register queue
        _d: $.Deferred().resolve(),
        // (T)OC xml data
        _t: 0,
        // pre(F)etched next chapter
        // handler (I)nvoker
        _i: function (page, procedure, _this, _defer1) {
            _this = this;
            _defer1 = $.Deferred();
            _this._d.done(function (_defer2) {
                _defer2 = new $.Deferred();
                _defer2.done(function () {
                    _defer1.resolve();
                });
                switch (typeof page) {
                    case 'function':
                        procedure = page;
                        page = true;
                        break;
                    case 'string':
                        page = page == '*' || page == _this.p;
                        break;
                    case 'object':
                        page = -1 != $.inArray(_this.p, page);
                        break;
                    default:
                        page = false;
                }
                if (!page) return _defer2.resolve();
                procedure.call(_this, $, _defer2.resolve);
            });
            _this._d = _defer1;
        },
        // register a repeatable handler for page states in variant pages
        on: function (page, procedure, _this) {
            _this = this;
            _this._o.push([page, procedure]);
            _this._i(page, procedure);
            return _this;
        },
        // register an once handler in variant pages
        once: function (page, procedure, _this) {
            _this = this;
            _this._i(page, procedure);
            return _this;
        },
        // (O)ops handler
        o: function () {
            return false;
        },
        // (E)rror
        e: function (message, $_error, $_panel, _size, _ww, _pw) {
            $('body').append(
                '<div class="error"><div class="_"></div>' +
                '<dl><dt><span class="ico ico-sad"></span></dt>' +
                '<dd>' + message + '</dd>' +
                '<dd>请<a href="#" onclick="location.reload();return 0">刷新页面</a>以尝试解决这个问题。</dd>' +
                '</dl></div>'
            );
            $_error = $('.error');
            $_panel = $_error.children('dl');
            _size = 40;
            _ww = $_error.width();
            _pw = Math.min(480, _ww - _size);
            $_panel.css({
                width: _pw,
                left: Math.floor((_ww - _pw) / 2)
            });
            $_panel.css('top', Math.floor(($_error.height() - $_panel.height() - _size) / 2));
            $_error.css({
                top: 0,
                left: 0
            });
        },
        // (R)e-invoke handlers
        _r: function (_this) {
            _this = this;
            $.each(_this._o, function (index, hook) {
                _this._i(hook[0], hook[1]);
            });
        },
        // (R)estore previous state
        r: function (state, _this, $_toc, _html, $_a, _value) {
            if ($('h2').text() == state.t) return;
            document.title = state.n + ' ' + state.t + ' | CCNR v2';
            _this = this;
            $_toc = _this._t.find('Chapter');
            _html = '<h2>' + state.t + '</h2>' +
                $.map(state.p, function (text) {
                    return '<p>' + text + '</p>';
                }).join('');
            $_a = $('aside a:first');
            _value = state['-'];
            $_a.attr('href', _value);
            if ('#' == _value) {
                $_a.removeAttr('title')
                    .click(_this.o);
            } else $_a.attr('title', '《' + $($_toc.get(_value - 1)).text() + '》')
                .off('click', _this.o);
            $_a = $('aside a:last');
            _value = state['+'];
            $_a.attr('href', _value);
            if ('#' == _value) {
                $_a.removeAttr('title')
                    .click(_this.o);
            } else $_a.attr('title', '《' + $($_toc.get(_value - 1)).text() + '》')
                .off('click', _this.o);
            $('article').html(_html);
            this.w = 0;
            this._r();
        }
    };
}(jQuery))

// TOGGLEs novel title on scrolling
.once(function ($, done, $_body, $_top, _s, _d, _c, _t, _n) {
    $_body = $(document.body);
    $_top = $('aside a:first');
    _s = 'scrolled';
    _d = 'disabled';
    _c = 'span';
    _t = 'ico-top';
    _n = 'ico-notop';
    $(window).scroll(function () {
        if (0 < window.scrollY) {
            $_body.addClass(_s);
            $_top.removeClass(_d)
                .children(_c)
                .addClass(_t)
                .removeClass(_n);
        } else {
            $_body.removeClass(_s);
            $_top.addClass(_d)
                .children(_c)
                .addClass(_n)
                .removeClass(_t);
        }
    });
    done();
})

// FETCHes TOC xml data
.once('chapter', function ($, done, _this) {
    _this = this;
    $.get($('article').data('toc')).done(function (data, $_xml) {
        _this._t = $_xml = $(data);
        document.title = $_xml.find('Title').text() + ' ' + document.title; // ADD the novel title to the page title
        done();
    }).fail(function () {
        _this.e('章节列表数据读取失败');
    });
})

// SHOWs TOC links
.once('chapter', function ($, done, _this, _id, $_chapters, $_a, $_badge) {
    _this = this;
    _id = location.pathname.split('/').pop() - 0;
    $_chapters = _this._t.find('Chapter');
    $_a = $('aside a:eq(1)'); // ADD previous page link
    if (1 < _id) {
        $_a.attr('href', _id - 1)
            .attr('title', '《' + $($_chapters.get(_id - 2)).text() + '》')
            .removeClass('disabled');
    } else {
        $_a.addClass('disabled')
            .click(_this.o);
    }
    $_a = $('aside a:last'); // ADD next page link
    if (_id < $_chapters.length) {
        $_a.attr('href', _id + 1)
            .attr('title', '《' + $($_chapters.get(_id)).text() + '》')
            .removeClass('disabled');
        $_badge = $_a.children('.badge');
        $_badge.text($_chapters.length - _id);
        if (!document.referrer)
            $_badge.removeClass('hidden');
    } else {
        $_a.addClass('disabled')
            .click(_this.o);
    }
    $('aside').removeClass('hidden'); // SHOW the nav links
    done();
})

// NAVIGATEs sibling chapter page on key press
.once('chapter', function ($, done, _this) {
    _this = this;
    $(document).keydown(function (event, _pos) {
        _pos = $.inArray(event.which, [37, 13, 39]);
        if (-1 == _pos || event.which == _this.w) return;
        _this.w = event.which;
        $('aside a:eq(' + (1 + _pos) + ')').click();
    });
    done();
})

////////////////////////////////////////////////////////////// CHAPTER STATE ///

// CONVERTs to history state
.once('chapter', function ($, done, _this) {
    _this = this;
    if (!_this.s) return done();
    $(window).on('popstate', function (ev) {
        if (history.state) _this.r(history.state);
    });
    $(document).ready(function (_state) {
        _state = {
            t: $('h2').text(),
            p: [],
            '-': $('aside a:eq(1)').attr('href'),
            '+': $('aside a:last').attr('href')
        };
        _state.n = document.title.split(_state.t)[0].replace(/\s*$/, '');
        $('p').each(function (index, p) {
            _state.p.push($(p).text());
        });
        history.replaceState(_state, '', location.href.replace(/^.*\//, ''));
        done();
    });
})

// PREFETCHs the next chapter data
.on('chapter', function ($, done, _this, $_a, _id) {
    _this = this;
    $_a = $('aside a:last');
    _id = $_a.attr('href');
    if (!_this.s || '#' == _id) return done();
    _id -= 0;
    $.get(_id).done(function (data, $_xml, _state) {
        $_xml = $(data);
        _state = {
            n: history.state.n,
            t: $_xml.find('Title').text(),
            p: [],
            '-': '#',
            '+': '#'
        };
        $_xml.find('Paragraph').each(function (index, p) {
            _state.p.push($(p).text());
        });
        if (1 < _id)
            _state['-'] = _id - 1;
        if (_id < _this._t.find('Chapter').length)
            _state['+'] = _id + 1;
        $_a.attr('class', 'prefetched');
        _this._f = _state;
    });
    done();
})

// CHANGEs history state instead of page
.on('chapter', function ($, done, $_a, _this) {
    $_a = $('aside a:last[href!="#"]');
    _this = this;
    if (!_this.s) return done();
    $_a.click(function (_state) {
        _state = _this._f;
        if (!_state) return true;
        history.pushState(_state, '', $_a.attr('href'));
        window.scrollTo(0, 0);
        _this.r(_state);
        delete _this._f;
        $('.badge').addClass('hidden');
        return false;
    });
    done();
})
;

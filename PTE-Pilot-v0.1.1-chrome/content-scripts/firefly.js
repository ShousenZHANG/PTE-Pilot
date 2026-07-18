var firefly = (function () {
  var e = Object.create,
    t = Object.defineProperty,
    n = Object.getOwnPropertyDescriptor,
    r = Object.getOwnPropertyNames,
    i = Object.getPrototypeOf,
    a = Object.prototype.hasOwnProperty,
    o = (e, t) => () => (
      t || (e((t = { exports: {} }).exports, t), (e = null)), t.exports
    ),
    s = (e, i, o, s) => {
      if ((i && typeof i == `object`) || typeof i == `function`)
        for (var c = r(i), l = 0, u = c.length, d; l < u; l++)
          (d = c[l]),
            !a.call(e, d) &&
              d !== o &&
              t(e, d, {
                get: ((e) => i[e]).bind(null, d),
                enumerable: !(s = n(i, d)) || s.enumerable,
              });
      return e;
    },
    c = (n, r, a) => (
      (a = n == null ? {} : e(i(n))),
      s(
        r || !n || !n.__esModule
          ? t(a, `default`, { value: n, enumerable: !0 })
          : a,
        n,
      )
    ),
    l = o((e) => {
      function t(e, t) {
        var n = e.length;
        e.push(t);
        for (; 0 < n; ) {
          var r = (n - 1) >>> 1,
            a = e[r];
          if (0 < i(a, t)) (e[r] = t), (e[n] = a), (n = r);
          else break;
        }
      }
      function n(e) {
        return e.length === 0 ? null : e[0];
      }
      function r(e) {
        if (e.length === 0) return null;
        var t = e[0],
          n = e.pop();
        if (n !== t) {
          e[0] = n;
          for (var r = 0, a = e.length, o = a >>> 1; r < o; ) {
            var s = 2 * (r + 1) - 1,
              c = e[s],
              l = s + 1,
              u = e[l];
            if (0 > i(c, n))
              l < a && 0 > i(u, c)
                ? ((e[r] = u), (e[l] = n), (r = l))
                : ((e[r] = c), (e[s] = n), (r = s));
            else if (l < a && 0 > i(u, n)) (e[r] = u), (e[l] = n), (r = l);
            else break;
          }
        }
        return t;
      }
      function i(e, t) {
        var n = e.sortIndex - t.sortIndex;
        return n === 0 ? e.id - t.id : n;
      }
      if (
        ((e.unstable_now = void 0),
        typeof performance == `object` && typeof performance.now == `function`)
      ) {
        var a = performance;
        e.unstable_now = () => a.now();
      } else {
        var o = Date,
          s = o.now();
        e.unstable_now = () => o.now() - s;
      }
      var c = [],
        l = [],
        u = 1,
        d = null,
        f = 3,
        p = !1,
        m = !1,
        h = !1,
        g = !1,
        _ = typeof setTimeout == `function` ? setTimeout : null,
        v = typeof clearTimeout == `function` ? clearTimeout : null,
        y = typeof setImmediate < `u` ? setImmediate : null;
      function b(e) {
        for (var i = n(l); i !== null; ) {
          if (i.callback === null) r(l);
          else if (i.startTime <= e)
            r(l), (i.sortIndex = i.expirationTime), t(c, i);
          else break;
          i = n(l);
        }
      }
      function x(e) {
        if (((h = !1), b(e), !m))
          if (n(c) !== null) (m = !0), ee || ((ee = !0), ae());
          else {
            var t = n(l);
            t !== null && ce(x, t.startTime - e);
          }
      }
      var ee = !1,
        te = -1,
        S = 5,
        ne = -1;
      function re() {
        return g ? !0 : !(e.unstable_now() - ne < S);
      }
      function ie() {
        if (((g = !1), ee)) {
          var t = e.unstable_now();
          ne = t;
          var i = !0;
          try {
            a: {
              (m = !1), h && ((h = !1), v(te), (te = -1)), (p = !0);
              var a = f;
              try {
                b: {
                  for (
                    b(t), d = n(c);
                    d !== null && !(d.expirationTime > t && re());
                  ) {
                    var o = d.callback;
                    if (typeof o == `function`) {
                      (d.callback = null), (f = d.priorityLevel);
                      var s = o(d.expirationTime <= t);
                      if (((t = e.unstable_now()), typeof s == `function`)) {
                        (d.callback = s), b(t), (i = !0);
                        break b;
                      }
                      d === n(c) && r(c), b(t);
                    } else r(c);
                    d = n(c);
                  }
                  if (d !== null) i = !0;
                  else {
                    var u = n(l);
                    u !== null && ce(x, u.startTime - t), (i = !1);
                  }
                }
                break a;
              } finally {
                (d = null), (f = a), (p = !1);
              }
              i = void 0;
            }
          } finally {
            i ? ae() : (ee = !1);
          }
        }
      }
      var ae;
      if (typeof y == `function`)
        ae = () => {
          y(ie);
        };
      else if (typeof MessageChannel < `u`) {
        var oe = new MessageChannel(),
          se = oe.port2;
        (oe.port1.onmessage = ie),
          (ae = () => {
            se.postMessage(null);
          });
      } else
        ae = () => {
          _(ie, 0);
        };
      function ce(t, n) {
        te = _(() => {
          t(e.unstable_now());
        }, n);
      }
      (e.unstable_IdlePriority = 5),
        (e.unstable_ImmediatePriority = 1),
        (e.unstable_LowPriority = 4),
        (e.unstable_NormalPriority = 3),
        (e.unstable_Profiling = null),
        (e.unstable_UserBlockingPriority = 2),
        (e.unstable_cancelCallback = (e) => {
          e.callback = null;
        }),
        (e.unstable_forceFrameRate = (e) => {
          0 > e || 125 < e
            ? console.error(
                `forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported`,
              )
            : (S = 0 < e ? Math.floor(1e3 / e) : 5);
        }),
        (e.unstable_getCurrentPriorityLevel = () => f),
        (e.unstable_next = (e) => {
          switch (f) {
            case 1:
            case 2:
            case 3: {
              var t = 3;
              break;
            }
            default:
              t = f;
          }
          var n = f;
          f = t;
          try {
            return e();
          } finally {
            f = n;
          }
        }),
        (e.unstable_requestPaint = () => {
          g = !0;
        }),
        (e.unstable_runWithPriority = (e, t) => {
          switch (e) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 5:
              break;
            default:
              e = 3;
          }
          var n = f;
          f = e;
          try {
            return t();
          } finally {
            f = n;
          }
        }),
        (e.unstable_scheduleCallback = (r, i, a) => {
          var o = e.unstable_now();
          switch (
            (typeof a == `object` && a
              ? ((a = a.delay), (a = typeof a == `number` && 0 < a ? o + a : o))
              : (a = o),
            r)
          ) {
            case 1: {
              var s = -1;
              break;
            }
            case 2:
              s = 250;
              break;
            case 5:
              s = 1073741823;
              break;
            case 4:
              s = 1e4;
              break;
            default:
              s = 5e3;
          }
          return (
            (s = a + s),
            (r = {
              id: u++,
              callback: i,
              priorityLevel: r,
              startTime: a,
              expirationTime: s,
              sortIndex: -1,
            }),
            a > o
              ? ((r.sortIndex = a),
                t(l, r),
                n(c) === null &&
                  r === n(l) &&
                  (h ? (v(te), (te = -1)) : (h = !0), ce(x, a - o)))
              : ((r.sortIndex = s),
                t(c, r),
                m || p || ((m = !0), ee || ((ee = !0), ae()))),
            r
          );
        }),
        (e.unstable_shouldYield = re),
        (e.unstable_wrapCallback = (e) => {
          var t = f;
          return function () {
            var n = f;
            f = t;
            try {
              return e.apply(this, arguments);
            } finally {
              f = n;
            }
          };
        });
    }),
    u = o((e, t) => {
      t.exports = l();
    }),
    d = o((e) => {
      var t = Symbol.for(`react.transitional.element`),
        n = Symbol.for(`react.portal`),
        r = Symbol.for(`react.fragment`),
        i = Symbol.for(`react.strict_mode`),
        a = Symbol.for(`react.profiler`),
        o = Symbol.for(`react.consumer`),
        s = Symbol.for(`react.context`),
        c = Symbol.for(`react.forward_ref`),
        l = Symbol.for(`react.suspense`),
        u = Symbol.for(`react.memo`),
        d = Symbol.for(`react.lazy`),
        f = Symbol.for(`react.activity`),
        p = Symbol.iterator;
      function m(e) {
        return typeof e != `object` || !e
          ? null
          : ((e = (p && e[p]) || e[`@@iterator`]),
            typeof e == `function` ? e : null);
      }
      var h = {
          isMounted: () => !1,
          enqueueForceUpdate: () => {},
          enqueueReplaceState: () => {},
          enqueueSetState: () => {},
        },
        g = Object.assign,
        _ = {};
      function v(e, t, n) {
        (this.props = e),
          (this.context = t),
          (this.refs = _),
          (this.updater = n || h);
      }
      (v.prototype.isReactComponent = {}),
        (v.prototype.setState = function (e, t) {
          if (typeof e != `object` && typeof e != `function` && e != null)
            throw Error(
              `takes an object of state variables to update or a function which returns an object of state variables.`,
            );
          this.updater.enqueueSetState(this, e, t, `setState`);
        }),
        (v.prototype.forceUpdate = function (e) {
          this.updater.enqueueForceUpdate(this, e, `forceUpdate`);
        });
      function y() {}
      y.prototype = v.prototype;
      function b(e, t, n) {
        (this.props = e),
          (this.context = t),
          (this.refs = _),
          (this.updater = n || h);
      }
      var x = (b.prototype = new y());
      (x.constructor = b), g(x, v.prototype), (x.isPureReactComponent = !0);
      var ee = Array.isArray;
      function te() {}
      var S = { H: null, A: null, T: null, S: null },
        ne = Object.prototype.hasOwnProperty;
      function re(e, n, r) {
        var i = r.ref;
        return {
          $$typeof: t,
          type: e,
          key: n,
          ref: i === void 0 ? null : i,
          props: r,
        };
      }
      function ie(e, t) {
        return re(e.type, t, e.props);
      }
      function ae(e) {
        return typeof e == `object` && !!e && e.$$typeof === t;
      }
      function oe(e) {
        var t = { "=": `=0`, ":": `=2` };
        return `$` + e.replace(/[=:]/g, (e) => t[e]);
      }
      var se = /\/+/g;
      function ce(e, t) {
        return typeof e == `object` && e && e.key != null
          ? oe(`` + e.key)
          : t.toString(36);
      }
      function C(e) {
        switch (e.status) {
          case `fulfilled`:
            return e.value;
          case `rejected`:
            throw e.reason;
          default:
            switch (
              (typeof e.status == `string`
                ? e.then(te, te)
                : ((e.status = `pending`),
                  e.then(
                    (t) => {
                      e.status === `pending` &&
                        ((e.status = `fulfilled`), (e.value = t));
                    },
                    (t) => {
                      e.status === `pending` &&
                        ((e.status = `rejected`), (e.reason = t));
                    },
                  )),
              e.status)
            ) {
              case `fulfilled`:
                return e.value;
              case `rejected`:
                throw e.reason;
            }
        }
        throw e;
      }
      function le(e, r, i, a, o) {
        var s = typeof e;
        (s === `undefined` || s === `boolean`) && (e = null);
        var c = !1;
        if (e === null) c = !0;
        else
          switch (s) {
            case `bigint`:
            case `string`:
            case `number`:
              c = !0;
              break;
            case `object`:
              switch (e.$$typeof) {
                case t:
                case n:
                  c = !0;
                  break;
                case d:
                  return (c = e._init), le(c(e._payload), r, i, a, o);
              }
          }
        if (c)
          return (
            (o = o(e)),
            (c = a === `` ? `.` + ce(e, 0) : a),
            ee(o)
              ? ((i = ``),
                c != null && (i = c.replace(se, `$&/`) + `/`),
                le(o, r, i, ``, (e) => e))
              : o != null &&
                (ae(o) &&
                  (o = ie(
                    o,
                    i +
                      (o.key == null || (e && e.key === o.key)
                        ? ``
                        : (`` + o.key).replace(se, `$&/`) + `/`) +
                      c,
                  )),
                r.push(o)),
            1
          );
        c = 0;
        var l = a === `` ? `.` : a + `:`;
        if (ee(e))
          for (var u = 0; u < e.length; u++)
            (a = e[u]), (s = l + ce(a, u)), (c += le(a, r, i, s, o));
        else if (((u = m(e)), typeof u == `function`))
          for (e = u.call(e), u = 0; !(a = e.next()).done; )
            (a = a.value), (s = l + ce(a, u++)), (c += le(a, r, i, s, o));
        else if (s === `object`) {
          if (typeof e.then == `function`) return le(C(e), r, i, a, o);
          throw (
            ((r = String(e)),
            Error(
              `Objects are not valid as a React child (found: ` +
                (r === `[object Object]`
                  ? `object with keys {` + Object.keys(e).join(`, `) + `}`
                  : r) +
                `). If you meant to render a collection of children, use an array instead.`,
            ))
          );
        }
        return c;
      }
      function w(e, t, n) {
        if (e == null) return e;
        var r = [],
          i = 0;
        return le(e, r, ``, ``, (e) => t.call(n, e, i++)), r;
      }
      function ue(e) {
        if (e._status === -1) {
          var t = e._result;
          (t = t()),
            t.then(
              (t) => {
                (e._status === 0 || e._status === -1) &&
                  ((e._status = 1), (e._result = t));
              },
              (t) => {
                (e._status === 0 || e._status === -1) &&
                  ((e._status = 2), (e._result = t));
              },
            ),
            e._status === -1 && ((e._status = 0), (e._result = t));
        }
        if (e._status === 1) return e._result.default;
        throw e._result;
      }
      var T =
          typeof reportError == `function`
            ? reportError
            : (e) => {
                if (
                  typeof window == `object` &&
                  typeof window.ErrorEvent == `function`
                ) {
                  var t = new window.ErrorEvent(`error`, {
                    bubbles: !0,
                    cancelable: !0,
                    message:
                      typeof e == `object` && e && typeof e.message == `string`
                        ? String(e.message)
                        : String(e),
                    error: e,
                  });
                  if (!window.dispatchEvent(t)) return;
                } else if (
                  typeof process == `object` &&
                  typeof process.emit == `function`
                ) {
                  process.emit(`uncaughtException`, e);
                  return;
                }
                console.error(e);
              },
        E = {
          map: w,
          forEach: (e, t, n) => {
            w(
              e,
              function () {
                t.apply(this, arguments);
              },
              n,
            );
          },
          count: (e) => {
            var t = 0;
            return (
              w(e, () => {
                t++;
              }),
              t
            );
          },
          toArray: (e) => w(e, (e) => e) || [],
          only: (e) => {
            if (!ae(e))
              throw Error(
                `React.Children.only expected to receive a single React element child.`,
              );
            return e;
          },
        };
      (e.Activity = f),
        (e.Children = E),
        (e.Component = v),
        (e.Fragment = r),
        (e.Profiler = a),
        (e.PureComponent = b),
        (e.StrictMode = i),
        (e.Suspense = l),
        (e.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = S),
        (e.__COMPILER_RUNTIME = {
          __proto__: null,
          c: (e) => S.H.useMemoCache(e),
        }),
        (e.cache = (e) =>
          function () {
            return e.apply(null, arguments);
          }),
        (e.cacheSignal = () => null),
        (e.cloneElement = function (e, t, n) {
          if (e == null)
            throw Error(
              `The argument must be a React element, but you passed ` + e + `.`,
            );
          var r = g({}, e.props),
            i = e.key;
          if (t != null)
            for (a in (t.key !== void 0 && (i = `` + t.key), t))
              !ne.call(t, a) ||
                a === `key` ||
                a === `__self` ||
                a === `__source` ||
                (a === `ref` && t.ref === void 0) ||
                (r[a] = t[a]);
          var a = arguments.length - 2;
          if (a === 1) r.children = n;
          else if (1 < a) {
            for (var o = Array(a), s = 0; s < a; s++) o[s] = arguments[s + 2];
            r.children = o;
          }
          return re(e.type, i, r);
        }),
        (e.createContext = (e) => (
          (e = {
            $$typeof: s,
            _currentValue: e,
            _currentValue2: e,
            _threadCount: 0,
            Provider: null,
            Consumer: null,
          }),
          (e.Provider = e),
          (e.Consumer = { $$typeof: o, _context: e }),
          e
        )),
        (e.createElement = function (e, t, n) {
          var r,
            i = {},
            a = null;
          if (t != null)
            for (r in (t.key !== void 0 && (a = `` + t.key), t))
              ne.call(t, r) &&
                r !== `key` &&
                r !== `__self` &&
                r !== `__source` &&
                (i[r] = t[r]);
          var o = arguments.length - 2;
          if (o === 1) i.children = n;
          else if (1 < o) {
            for (var s = Array(o), c = 0; c < o; c++) s[c] = arguments[c + 2];
            i.children = s;
          }
          if (e && e.defaultProps)
            for (r in ((o = e.defaultProps), o))
              i[r] === void 0 && (i[r] = o[r]);
          return re(e, a, i);
        }),
        (e.createRef = () => ({ current: null })),
        (e.forwardRef = (e) => ({ $$typeof: c, render: e })),
        (e.isValidElement = ae),
        (e.lazy = (e) => ({
          $$typeof: d,
          _payload: { _status: -1, _result: e },
          _init: ue,
        })),
        (e.memo = (e, t) => ({
          $$typeof: u,
          type: e,
          compare: t === void 0 ? null : t,
        })),
        (e.startTransition = (e) => {
          var t = S.T,
            n = {};
          S.T = n;
          try {
            var r = e(),
              i = S.S;
            i !== null && i(n, r),
              typeof r == `object` &&
                r &&
                typeof r.then == `function` &&
                r.then(te, T);
          } catch (e) {
            T(e);
          } finally {
            t !== null && n.types !== null && (t.types = n.types), (S.T = t);
          }
        }),
        (e.unstable_useCacheRefresh = () => S.H.useCacheRefresh()),
        (e.use = (e) => S.H.use(e)),
        (e.useActionState = (e, t, n) => S.H.useActionState(e, t, n)),
        (e.useCallback = (e, t) => S.H.useCallback(e, t)),
        (e.useContext = (e) => S.H.useContext(e)),
        (e.useDebugValue = () => {}),
        (e.useDeferredValue = (e, t) => S.H.useDeferredValue(e, t)),
        (e.useEffect = (e, t) => S.H.useEffect(e, t)),
        (e.useEffectEvent = (e) => S.H.useEffectEvent(e)),
        (e.useId = () => S.H.useId()),
        (e.useImperativeHandle = (e, t, n) => S.H.useImperativeHandle(e, t, n)),
        (e.useInsertionEffect = (e, t) => S.H.useInsertionEffect(e, t)),
        (e.useLayoutEffect = (e, t) => S.H.useLayoutEffect(e, t)),
        (e.useMemo = (e, t) => S.H.useMemo(e, t)),
        (e.useOptimistic = (e, t) => S.H.useOptimistic(e, t)),
        (e.useReducer = (e, t, n) => S.H.useReducer(e, t, n)),
        (e.useRef = (e) => S.H.useRef(e)),
        (e.useState = (e) => S.H.useState(e)),
        (e.useSyncExternalStore = (e, t, n) =>
          S.H.useSyncExternalStore(e, t, n)),
        (e.useTransition = () => S.H.useTransition()),
        (e.version = `19.2.7`);
    }),
    f = o((e, t) => {
      t.exports = d();
    }),
    p = o((e) => {
      var t = f();
      function n(e) {
        var t = `https://react.dev/errors/` + e;
        if (1 < arguments.length) {
          t += `?args[]=` + encodeURIComponent(arguments[1]);
          for (var n = 2; n < arguments.length; n++)
            t += `&args[]=` + encodeURIComponent(arguments[n]);
        }
        return (
          `Minified React error #` +
          e +
          `; visit ` +
          t +
          ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
        );
      }
      function r() {}
      var i = {
          d: {
            f: r,
            r: () => {
              throw Error(n(522));
            },
            D: r,
            C: r,
            L: r,
            m: r,
            X: r,
            S: r,
            M: r,
          },
          p: 0,
          findDOMNode: null,
        },
        a = Symbol.for(`react.portal`);
      function o(e, t, n) {
        var r =
          3 < arguments.length && arguments[3] !== void 0 ? arguments[3] : null;
        return {
          $$typeof: a,
          key: r == null ? null : `` + r,
          children: e,
          containerInfo: t,
          implementation: n,
        };
      }
      var s = t.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
      function c(e, t) {
        if (e === `font`) return ``;
        if (typeof t == `string`) return t === `use-credentials` ? t : ``;
      }
      (e.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE = i),
        (e.createPortal = function (e, t) {
          var r =
            2 < arguments.length && arguments[2] !== void 0
              ? arguments[2]
              : null;
          if (!t || (t.nodeType !== 1 && t.nodeType !== 9 && t.nodeType !== 11))
            throw Error(n(299));
          return o(e, t, null, r);
        }),
        (e.flushSync = (e) => {
          var t = s.T,
            n = i.p;
          try {
            if (((s.T = null), (i.p = 2), e)) return e();
          } finally {
            (s.T = t), (i.p = n), i.d.f();
          }
        }),
        (e.preconnect = (e, t) => {
          typeof e == `string` &&
            (t
              ? ((t = t.crossOrigin),
                (t =
                  typeof t == `string`
                    ? t === `use-credentials`
                      ? t
                      : ``
                    : void 0))
              : (t = null),
            i.d.C(e, t));
        }),
        (e.prefetchDNS = (e) => {
          typeof e == `string` && i.d.D(e);
        }),
        (e.preinit = (e, t) => {
          if (typeof e == `string` && t && typeof t.as == `string`) {
            var n = t.as,
              r = c(n, t.crossOrigin),
              a = typeof t.integrity == `string` ? t.integrity : void 0,
              o = typeof t.fetchPriority == `string` ? t.fetchPriority : void 0;
            n === `style`
              ? i.d.S(
                  e,
                  typeof t.precedence == `string` ? t.precedence : void 0,
                  { crossOrigin: r, integrity: a, fetchPriority: o },
                )
              : n === `script` &&
                i.d.X(e, {
                  crossOrigin: r,
                  integrity: a,
                  fetchPriority: o,
                  nonce: typeof t.nonce == `string` ? t.nonce : void 0,
                });
          }
        }),
        (e.preinitModule = (e, t) => {
          if (typeof e == `string`)
            if (typeof t == `object` && t) {
              if (t.as == null || t.as === `script`) {
                var n = c(t.as, t.crossOrigin);
                i.d.M(e, {
                  crossOrigin: n,
                  integrity:
                    typeof t.integrity == `string` ? t.integrity : void 0,
                  nonce: typeof t.nonce == `string` ? t.nonce : void 0,
                });
              }
            } else t ?? i.d.M(e);
        }),
        (e.preload = (e, t) => {
          if (
            typeof e == `string` &&
            typeof t == `object` &&
            t &&
            typeof t.as == `string`
          ) {
            var n = t.as,
              r = c(n, t.crossOrigin);
            i.d.L(e, n, {
              crossOrigin: r,
              integrity: typeof t.integrity == `string` ? t.integrity : void 0,
              nonce: typeof t.nonce == `string` ? t.nonce : void 0,
              type: typeof t.type == `string` ? t.type : void 0,
              fetchPriority:
                typeof t.fetchPriority == `string` ? t.fetchPriority : void 0,
              referrerPolicy:
                typeof t.referrerPolicy == `string` ? t.referrerPolicy : void 0,
              imageSrcSet:
                typeof t.imageSrcSet == `string` ? t.imageSrcSet : void 0,
              imageSizes:
                typeof t.imageSizes == `string` ? t.imageSizes : void 0,
              media: typeof t.media == `string` ? t.media : void 0,
            });
          }
        }),
        (e.preloadModule = (e, t) => {
          if (typeof e == `string`)
            if (t) {
              var n = c(t.as, t.crossOrigin);
              i.d.m(e, {
                as:
                  typeof t.as == `string` && t.as !== `script` ? t.as : void 0,
                crossOrigin: n,
                integrity:
                  typeof t.integrity == `string` ? t.integrity : void 0,
              });
            } else i.d.m(e);
        }),
        (e.requestFormReset = (e) => {
          i.d.r(e);
        }),
        (e.unstable_batchedUpdates = (e, t) => e(t)),
        (e.useFormState = (e, t, n) => s.H.useFormState(e, t, n)),
        (e.useFormStatus = () => s.H.useHostTransitionStatus()),
        (e.version = `19.2.7`);
    }),
    m = o((e, t) => {
      function n() {
        if (
          !(
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
          )
        )
          try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
          } catch (e) {
            console.error(e);
          }
      }
      n(), (t.exports = p());
    }),
    h = o((e) => {
      var t = u(),
        n = f(),
        r = m();
      function i(e) {
        var t = `https://react.dev/errors/` + e;
        if (1 < arguments.length) {
          t += `?args[]=` + encodeURIComponent(arguments[1]);
          for (var n = 2; n < arguments.length; n++)
            t += `&args[]=` + encodeURIComponent(arguments[n]);
        }
        return (
          `Minified React error #` +
          e +
          `; visit ` +
          t +
          ` for the full message or use the non-minified dev environment for full errors and additional helpful warnings.`
        );
      }
      function a(e) {
        return !(
          !e ||
          (e.nodeType !== 1 && e.nodeType !== 9 && e.nodeType !== 11)
        );
      }
      function o(e) {
        var t = e,
          n = e;
        if (e.alternate) for (; t.return; ) t = t.return;
        else {
          e = t;
          do (t = e), t.flags & 4098 && (n = t.return), (e = t.return);
          while (e);
        }
        return t.tag === 3 ? n : null;
      }
      function s(e) {
        if (e.tag === 13) {
          var t = e.memoizedState;
          if (
            (t === null &&
              ((e = e.alternate), e !== null && (t = e.memoizedState)),
            t !== null)
          )
            return t.dehydrated;
        }
        return null;
      }
      function c(e) {
        if (e.tag === 31) {
          var t = e.memoizedState;
          if (
            (t === null &&
              ((e = e.alternate), e !== null && (t = e.memoizedState)),
            t !== null)
          )
            return t.dehydrated;
        }
        return null;
      }
      function l(e) {
        if (o(e) !== e) throw Error(i(188));
      }
      function d(e) {
        var t = e.alternate;
        if (!t) {
          if (((t = o(e)), t === null)) throw Error(i(188));
          return t === e ? e : null;
        }
        for (var n = e, r = t; ; ) {
          var a = n.return;
          if (a === null) break;
          var s = a.alternate;
          if (s === null) {
            if (((r = a.return), r !== null)) {
              n = r;
              continue;
            }
            break;
          }
          if (a.child === s.child) {
            for (s = a.child; s; ) {
              if (s === n) return l(a), e;
              if (s === r) return l(a), t;
              s = s.sibling;
            }
            throw Error(i(188));
          }
          if (n.return !== r.return) (n = a), (r = s);
          else {
            for (var c = !1, u = a.child; u; ) {
              if (u === n) {
                (c = !0), (n = a), (r = s);
                break;
              }
              if (u === r) {
                (c = !0), (r = a), (n = s);
                break;
              }
              u = u.sibling;
            }
            if (!c) {
              for (u = s.child; u; ) {
                if (u === n) {
                  (c = !0), (n = s), (r = a);
                  break;
                }
                if (u === r) {
                  (c = !0), (r = s), (n = a);
                  break;
                }
                u = u.sibling;
              }
              if (!c) throw Error(i(189));
            }
          }
          if (n.alternate !== r) throw Error(i(190));
        }
        if (n.tag !== 3) throw Error(i(188));
        return n.stateNode.current === n ? e : t;
      }
      function p(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6) return e;
        for (e = e.child; e !== null; ) {
          if (((t = p(e)), t !== null)) return t;
          e = e.sibling;
        }
        return null;
      }
      var h = Object.assign,
        g = Symbol.for(`react.element`),
        _ = Symbol.for(`react.transitional.element`),
        v = Symbol.for(`react.portal`),
        y = Symbol.for(`react.fragment`),
        b = Symbol.for(`react.strict_mode`),
        x = Symbol.for(`react.profiler`),
        ee = Symbol.for(`react.consumer`),
        te = Symbol.for(`react.context`),
        S = Symbol.for(`react.forward_ref`),
        ne = Symbol.for(`react.suspense`),
        re = Symbol.for(`react.suspense_list`),
        ie = Symbol.for(`react.memo`),
        ae = Symbol.for(`react.lazy`),
        oe = Symbol.for(`react.activity`),
        se = Symbol.for(`react.memo_cache_sentinel`),
        ce = Symbol.iterator;
      function C(e) {
        return typeof e != `object` || !e
          ? null
          : ((e = (ce && e[ce]) || e[`@@iterator`]),
            typeof e == `function` ? e : null);
      }
      var le = Symbol.for(`react.client.reference`);
      function w(e) {
        if (e == null) return null;
        if (typeof e == `function`)
          return e.$$typeof === le ? null : e.displayName || e.name || null;
        if (typeof e == `string`) return e;
        switch (e) {
          case y:
            return `Fragment`;
          case x:
            return `Profiler`;
          case b:
            return `StrictMode`;
          case ne:
            return `Suspense`;
          case re:
            return `SuspenseList`;
          case oe:
            return `Activity`;
        }
        if (typeof e == `object`)
          switch (e.$$typeof) {
            case v:
              return `Portal`;
            case te:
              return e.displayName || `Context`;
            case ee:
              return (e._context.displayName || `Context`) + `.Consumer`;
            case S: {
              var t = e.render;
              return (
                (e = e.displayName),
                (e ||=
                  ((e = t.displayName || t.name || ``),
                  e === `` ? `ForwardRef` : `ForwardRef(` + e + `)`)),
                e
              );
            }
            case ie:
              return (
                (t = e.displayName || null),
                t === null ? w(e.type) || `Memo` : t
              );
            case ae:
              (t = e._payload), (e = e._init);
              try {
                return w(e(t));
              } catch {}
          }
        return null;
      }
      var ue = Array.isArray,
        T = n.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
        E = r.__DOM_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE,
        de = { pending: !1, data: null, method: null, action: null },
        fe = [],
        pe = -1;
      function me(e) {
        return { current: e };
      }
      function he(e) {
        0 > pe || ((e.current = fe[pe]), (fe[pe] = null), pe--);
      }
      function D(e, t) {
        pe++, (fe[pe] = e.current), (e.current = t);
      }
      var ge = me(null),
        _e = me(null),
        ve = me(null),
        ye = me(null);
      function O(e, t) {
        switch ((D(ve, t), D(_e, e), D(ge, null), t.nodeType)) {
          case 9:
          case 11:
            e = (e = t.documentElement) && (e = e.namespaceURI) ? Vd(e) : 0;
            break;
          default:
            if (((e = t.tagName), (t = t.namespaceURI)))
              (t = Vd(t)), (e = Hd(t, e));
            else
              switch (e) {
                case `svg`:
                  e = 1;
                  break;
                case `math`:
                  e = 2;
                  break;
                default:
                  e = 0;
              }
        }
        he(ge), D(ge, e);
      }
      function be() {
        he(ge), he(_e), he(ve);
      }
      function xe(e) {
        e.memoizedState !== null && D(ye, e);
        var t = ge.current,
          n = Hd(t, e.type);
        t !== n && (D(_e, e), D(ge, n));
      }
      function Se(e) {
        _e.current === e && (he(ge), he(_e)),
          ye.current === e && (he(ye), (Qf._currentValue = de));
      }
      var Ce, we;
      function Te(e) {
        if (Ce === void 0)
          try {
            throw Error();
          } catch (e) {
            var t = e.stack.trim().match(/\n( *(at )?)/);
            (Ce = (t && t[1]) || ``),
              (we =
                -1 <
                e.stack.indexOf(`
    at`)
                  ? ` (<anonymous>)`
                  : -1 < e.stack.indexOf(`@`)
                    ? `@unknown:0:0`
                    : ``);
          }
        return (
          `
` +
          Ce +
          e +
          we
        );
      }
      var Ee = !1;
      function De(e, t) {
        if (!e || Ee) return ``;
        Ee = !0;
        var n = Error.prepareStackTrace;
        Error.prepareStackTrace = void 0;
        try {
          var r = {
            DetermineComponentFrameRoot: () => {
              try {
                if (t) {
                  var n = () => {
                    throw Error();
                  };
                  if (
                    (Object.defineProperty(n.prototype, "props", {
                      set: () => {
                        throw Error();
                      },
                    }),
                    typeof Reflect == `object` && Reflect.construct)
                  ) {
                    try {
                      Reflect.construct(n, []);
                    } catch (e) {
                      var r = e;
                    }
                    Reflect.construct(e, [], n);
                  } else {
                    try {
                      n.call();
                    } catch (e) {
                      r = e;
                    }
                    e.call(n.prototype);
                  }
                } else {
                  try {
                    throw Error();
                  } catch (e) {
                    r = e;
                  }
                  (n = e()) &&
                    typeof n.catch == `function` &&
                    n.catch(() => {});
                }
              } catch (e) {
                if (e && r && typeof e.stack == `string`)
                  return [e.stack, r.stack];
              }
              return [null, null];
            },
          };
          r.DetermineComponentFrameRoot.displayName = `DetermineComponentFrameRoot`;
          var i = Object.getOwnPropertyDescriptor(
            r.DetermineComponentFrameRoot,
            `name`,
          );
          i &&
            i.configurable &&
            Object.defineProperty(r.DetermineComponentFrameRoot, "name", {
              value: `DetermineComponentFrameRoot`,
            });
          var a = r.DetermineComponentFrameRoot(),
            o = a[0],
            s = a[1];
          if (o && s) {
            var c = o.split(`
`),
              l = s.split(`
`);
            for (
              i = r = 0;
              r < c.length && !c[r].includes(`DetermineComponentFrameRoot`);
            )
              r++;
            for (
              ;
              i < l.length && !l[i].includes(`DetermineComponentFrameRoot`);
            )
              i++;
            if (r === c.length || i === l.length)
              for (
                r = c.length - 1, i = l.length - 1;
                1 <= r && 0 <= i && c[r] !== l[i];
              )
                i--;
            for (; 1 <= r && 0 <= i; r--, i--)
              if (c[r] !== l[i]) {
                if (r !== 1 || i !== 1)
                  do
                    if ((r--, i--, 0 > i || c[r] !== l[i])) {
                      var u =
                        `
` + c[r].replace(` at new `, ` at `);
                      return (
                        e.displayName &&
                          u.includes(`<anonymous>`) &&
                          (u = u.replace(`<anonymous>`, e.displayName)),
                        u
                      );
                    }
                  while (1 <= r && 0 <= i);
                break;
              }
          }
        } finally {
          (Ee = !1), (Error.prepareStackTrace = n);
        }
        return (n = e ? e.displayName || e.name : ``) ? Te(n) : ``;
      }
      function Oe(e, t) {
        switch (e.tag) {
          case 26:
          case 27:
          case 5:
            return Te(e.type);
          case 16:
            return Te(`Lazy`);
          case 13:
            return e.child !== t && t !== null
              ? Te(`Suspense Fallback`)
              : Te(`Suspense`);
          case 19:
            return Te(`SuspenseList`);
          case 0:
          case 15:
            return De(e.type, !1);
          case 11:
            return De(e.type.render, !1);
          case 1:
            return De(e.type, !0);
          case 31:
            return Te(`Activity`);
          default:
            return ``;
        }
      }
      function ke(e) {
        try {
          var t = ``,
            n = null;
          do (t += Oe(e, n)), (n = e), (e = e.return);
          while (e);
          return t;
        } catch (e) {
          return (
            `
Error generating stack: ` +
            e.message +
            `
` +
            e.stack
          );
        }
      }
      var k = Object.prototype.hasOwnProperty,
        Ae = t.unstable_scheduleCallback,
        je = t.unstable_cancelCallback,
        Me = t.unstable_shouldYield,
        Ne = t.unstable_requestPaint,
        Pe = t.unstable_now,
        Fe = t.unstable_getCurrentPriorityLevel,
        Ie = t.unstable_ImmediatePriority,
        Le = t.unstable_UserBlockingPriority,
        Re = t.unstable_NormalPriority,
        ze = t.unstable_LowPriority,
        Be = t.unstable_IdlePriority,
        Ve = t.log,
        He = t.unstable_setDisableYieldValue,
        Ue = null,
        We = null;
      function Ge(e) {
        if (
          (typeof Ve == `function` && He(e),
          We && typeof We.setStrictMode == `function`)
        )
          try {
            We.setStrictMode(Ue, e);
          } catch {}
      }
      var Ke = Math.clz32 ? Math.clz32 : Ye,
        qe = Math.log,
        Je = Math.LN2;
      function Ye(e) {
        return (e >>>= 0), e === 0 ? 32 : (31 - ((qe(e) / Je) | 0)) | 0;
      }
      var Xe = 256,
        Ze = 262144,
        Qe = 4194304;
      function $e(e) {
        var t = e & 42;
        if (t !== 0) return t;
        switch (e & -e) {
          case 1:
            return 1;
          case 2:
            return 2;
          case 4:
            return 4;
          case 8:
            return 8;
          case 16:
            return 16;
          case 32:
            return 32;
          case 64:
            return 64;
          case 128:
            return 128;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
            return e & 261888;
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return e & 3932160;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return e & 62914560;
          case 67108864:
            return 67108864;
          case 134217728:
            return 134217728;
          case 268435456:
            return 268435456;
          case 536870912:
            return 536870912;
          case 1073741824:
            return 0;
          default:
            return e;
        }
      }
      function et(e, t, n) {
        var r = e.pendingLanes;
        if (r === 0) return 0;
        var i = 0,
          a = e.suspendedLanes,
          o = e.pingedLanes;
        e = e.warmLanes;
        var s = r & 134217727;
        return (
          s === 0
            ? ((s = r & ~a),
              s === 0
                ? o === 0
                  ? n || ((n = r & ~e), n !== 0 && (i = $e(n)))
                  : (i = $e(o))
                : (i = $e(s)))
            : ((r = s & ~a),
              r === 0
                ? ((o &= s),
                  o === 0
                    ? n || ((n = s & ~e), n !== 0 && (i = $e(n)))
                    : (i = $e(o)))
                : (i = $e(r))),
          i === 0
            ? 0
            : t !== 0 &&
                t !== i &&
                (t & a) === 0 &&
                ((a = i & -i),
                (n = t & -t),
                a >= n || (a === 32 && n & 4194048))
              ? t
              : i
        );
      }
      function tt(e, t) {
        return (
          (e.pendingLanes & ~(e.suspendedLanes & ~e.pingedLanes) & t) === 0
        );
      }
      function nt(e, t) {
        switch (e) {
          case 1:
          case 2:
          case 4:
          case 8:
          case 64:
            return t + 250;
          case 16:
          case 32:
          case 128:
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
            return t + 5e3;
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            return -1;
          case 67108864:
          case 134217728:
          case 268435456:
          case 536870912:
          case 1073741824:
            return -1;
          default:
            return -1;
        }
      }
      function rt() {
        var e = Qe;
        return (Qe <<= 1), !(Qe & 62914560) && (Qe = 4194304), e;
      }
      function it(e) {
        for (var t = [], n = 0; 31 > n; n++) t.push(e);
        return t;
      }
      function at(e, t) {
        (e.pendingLanes |= t),
          t !== 268435456 &&
            ((e.suspendedLanes = 0), (e.pingedLanes = 0), (e.warmLanes = 0));
      }
      function ot(e, t, n, r, i, a) {
        var o = e.pendingLanes;
        (e.pendingLanes = n),
          (e.suspendedLanes = 0),
          (e.pingedLanes = 0),
          (e.warmLanes = 0),
          (e.expiredLanes &= n),
          (e.entangledLanes &= n),
          (e.errorRecoveryDisabledLanes &= n),
          (e.shellSuspendCounter = 0);
        var s = e.entanglements,
          c = e.expirationTimes,
          l = e.hiddenUpdates;
        for (n = o & ~n; 0 < n; ) {
          var u = 31 - Ke(n),
            d = 1 << u;
          (s[u] = 0), (c[u] = -1);
          var f = l[u];
          if (f !== null)
            for (l[u] = null, u = 0; u < f.length; u++) {
              var p = f[u];
              p !== null && (p.lane &= -536870913);
            }
          n &= ~d;
        }
        r !== 0 && st(e, r, 0),
          a !== 0 &&
            i === 0 &&
            e.tag !== 0 &&
            (e.suspendedLanes |= a & ~(o & ~t));
      }
      function st(e, t, n) {
        (e.pendingLanes |= t), (e.suspendedLanes &= ~t);
        var r = 31 - Ke(t);
        (e.entangledLanes |= t),
          (e.entanglements[r] = e.entanglements[r] | 1073741824 | (n & 261930));
      }
      function ct(e, t) {
        var n = (e.entangledLanes |= t);
        for (e = e.entanglements; n; ) {
          var r = 31 - Ke(n),
            i = 1 << r;
          (i & t) | (e[r] & t) && (e[r] |= t), (n &= ~i);
        }
      }
      function lt(e, t) {
        var n = t & -t;
        return (
          (n = n & 42 ? 1 : ut(n)), (n & (e.suspendedLanes | t)) === 0 ? n : 0
        );
      }
      function ut(e) {
        switch (e) {
          case 2:
            e = 1;
            break;
          case 8:
            e = 4;
            break;
          case 32:
            e = 16;
            break;
          case 256:
          case 512:
          case 1024:
          case 2048:
          case 4096:
          case 8192:
          case 16384:
          case 32768:
          case 65536:
          case 131072:
          case 262144:
          case 524288:
          case 1048576:
          case 2097152:
          case 4194304:
          case 8388608:
          case 16777216:
          case 33554432:
            e = 128;
            break;
          case 268435456:
            e = 134217728;
            break;
          default:
            e = 0;
        }
        return e;
      }
      function dt(e) {
        return (
          (e &= -e), 2 < e ? (8 < e ? (e & 134217727 ? 32 : 268435456) : 8) : 2
        );
      }
      function ft() {
        var e = E.p;
        return e === 0
          ? ((e = window.event), e === void 0 ? 32 : mp(e.type))
          : e;
      }
      function pt(e, t) {
        var n = E.p;
        try {
          return (E.p = e), t();
        } finally {
          E.p = n;
        }
      }
      var mt = Math.random().toString(36).slice(2),
        ht = `__reactFiber$` + mt,
        gt = `__reactProps$` + mt,
        _t = `__reactContainer$` + mt,
        vt = `__reactEvents$` + mt,
        yt = `__reactListeners$` + mt,
        bt = `__reactHandles$` + mt,
        xt = `__reactResources$` + mt,
        St = `__reactMarker$` + mt;
      function Ct(e) {
        delete e[ht], delete e[gt], delete e[vt], delete e[yt], delete e[bt];
      }
      function wt(e) {
        var t = e[ht];
        if (t) return t;
        for (var n = e.parentNode; n; ) {
          if ((t = n[_t] || n[ht])) {
            if (
              ((n = t.alternate),
              t.child !== null || (n !== null && n.child !== null))
            )
              for (e = df(e); e !== null; ) {
                if ((n = e[ht])) return n;
                e = df(e);
              }
            return t;
          }
          (e = n), (n = e.parentNode);
        }
        return null;
      }
      function Tt(e) {
        if ((e = e[ht] || e[_t])) {
          var t = e.tag;
          if (
            t === 5 ||
            t === 6 ||
            t === 13 ||
            t === 31 ||
            t === 26 ||
            t === 27 ||
            t === 3
          )
            return e;
        }
        return null;
      }
      function Et(e) {
        var t = e.tag;
        if (t === 5 || t === 26 || t === 27 || t === 6) return e.stateNode;
        throw Error(i(33));
      }
      function Dt(e) {
        var t = e[xt];
        return (
          (t ||= e[xt] =
            { hoistableStyles: new Map(), hoistableScripts: new Map() }),
          t
        );
      }
      function Ot(e) {
        e[St] = !0;
      }
      var kt = new Set(),
        At = {};
      function jt(e, t) {
        Mt(e, t), Mt(e + `Capture`, t);
      }
      function Mt(e, t) {
        for (At[e] = t, e = 0; e < t.length; e++) kt.add(t[e]);
      }
      var Nt =
          /^[:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD][:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\-.0-9\u00B7\u0300-\u036F\u203F-\u2040]*$/,
        Pt = {},
        Ft = {};
      function It(e) {
        return k.call(Ft, e)
          ? !0
          : k.call(Pt, e)
            ? !1
            : Nt.test(e)
              ? (Ft[e] = !0)
              : ((Pt[e] = !0), !1);
      }
      function Lt(e, t, n) {
        if (It(t))
          if (n === null) e.removeAttribute(t);
          else {
            switch (typeof n) {
              case `undefined`:
              case `function`:
              case `symbol`:
                e.removeAttribute(t);
                return;
              case `boolean`: {
                var r = t.toLowerCase().slice(0, 5);
                if (r !== `data-` && r !== `aria-`) {
                  e.removeAttribute(t);
                  return;
                }
              }
            }
            e.setAttribute(t, `` + n);
          }
      }
      function Rt(e, t, n) {
        if (n === null) e.removeAttribute(t);
        else {
          switch (typeof n) {
            case `undefined`:
            case `function`:
            case `symbol`:
            case `boolean`:
              e.removeAttribute(t);
              return;
          }
          e.setAttribute(t, `` + n);
        }
      }
      function zt(e, t, n, r) {
        if (r === null) e.removeAttribute(n);
        else {
          switch (typeof r) {
            case `undefined`:
            case `function`:
            case `symbol`:
            case `boolean`:
              e.removeAttribute(n);
              return;
          }
          e.setAttributeNS(t, n, `` + r);
        }
      }
      function Bt(e) {
        switch (typeof e) {
          case `bigint`:
          case `boolean`:
          case `number`:
          case `string`:
          case `undefined`:
            return e;
          case `object`:
            return e;
          default:
            return ``;
        }
      }
      function Vt(e) {
        var t = e.type;
        return (
          (e = e.nodeName) &&
          e.toLowerCase() === `input` &&
          (t === `checkbox` || t === `radio`)
        );
      }
      function Ht(e, t, n) {
        var r = Object.getOwnPropertyDescriptor(e.constructor.prototype, t);
        if (
          !Object.hasOwn(e, t) &&
          r !== void 0 &&
          typeof r.get == `function` &&
          typeof r.set == `function`
        ) {
          var i = r.get,
            a = r.set;
          return (
            Object.defineProperty(e, t, {
              configurable: !0,
              get: function () {
                return i.call(this);
              },
              set: function (e) {
                (n = `` + e), a.call(this, e);
              },
            }),
            Object.defineProperty(e, t, { enumerable: r.enumerable }),
            {
              getValue: () => n,
              setValue: (e) => {
                n = `` + e;
              },
              stopTracking: () => {
                (e._valueTracker = null), delete e[t];
              },
            }
          );
        }
      }
      function Ut(e) {
        if (!e._valueTracker) {
          var t = Vt(e) ? `checked` : `value`;
          e._valueTracker = Ht(e, t, `` + e[t]);
        }
      }
      function Wt(e) {
        if (!e) return !1;
        var t = e._valueTracker;
        if (!t) return !0;
        var n = t.getValue(),
          r = ``;
        return (
          e && (r = Vt(e) ? (e.checked ? `true` : `false`) : e.value),
          (e = r),
          e === n ? !1 : (t.setValue(e), !0)
        );
      }
      function Gt(e) {
        if (((e ||= typeof document < `u` ? document : void 0), e === void 0))
          return null;
        try {
          return e.activeElement || e.body;
        } catch {
          return e.body;
        }
      }
      var Kt = /[\n"\\]/g;
      function qt(e) {
        return e.replace(Kt, (e) => `\\` + e.charCodeAt(0).toString(16) + ` `);
      }
      function Jt(e, t, n, r, i, a, o, s) {
        (e.name = ``),
          o != null &&
          typeof o != `function` &&
          typeof o != `symbol` &&
          typeof o != `boolean`
            ? (e.type = o)
            : e.removeAttribute(`type`),
          t == null
            ? (o !== `submit` && o !== `reset`) || e.removeAttribute(`value`)
            : o === `number`
              ? ((t === 0 && e.value === ``) || e.value != t) &&
                (e.value = `` + Bt(t))
              : e.value !== `` + Bt(t) && (e.value = `` + Bt(t)),
          t == null
            ? n == null
              ? r != null && e.removeAttribute(`value`)
              : Xt(e, o, Bt(n))
            : Xt(e, o, Bt(t)),
          i == null && a != null && (e.defaultChecked = !!a),
          i != null &&
            (e.checked = i && typeof i != `function` && typeof i != `symbol`),
          s != null &&
          typeof s != `function` &&
          typeof s != `symbol` &&
          typeof s != `boolean`
            ? (e.name = `` + Bt(s))
            : e.removeAttribute(`name`);
      }
      function Yt(e, t, n, r, i, a, o, s) {
        if (
          (a != null &&
            typeof a != `function` &&
            typeof a != `symbol` &&
            typeof a != `boolean` &&
            (e.type = a),
          t != null || n != null)
        ) {
          if (!((a !== `submit` && a !== `reset`) || t != null)) {
            Ut(e);
            return;
          }
          (n = n == null ? `` : `` + Bt(n)),
            (t = t == null ? n : `` + Bt(t)),
            s || t === e.value || (e.value = t),
            (e.defaultValue = t);
        }
        (r ??= i),
          (r = typeof r != `function` && typeof r != `symbol` && !!r),
          (e.checked = s ? e.checked : !!r),
          (e.defaultChecked = !!r),
          o != null &&
            typeof o != `function` &&
            typeof o != `symbol` &&
            typeof o != `boolean` &&
            (e.name = o),
          Ut(e);
      }
      function Xt(e, t, n) {
        (t === `number` && Gt(e.ownerDocument) === e) ||
          e.defaultValue === `` + n ||
          (e.defaultValue = `` + n);
      }
      function Zt(e, t, n, r) {
        if (((e = e.options), t)) {
          t = {};
          for (var i = 0; i < n.length; i++) t[`$` + n[i]] = !0;
          for (n = 0; n < e.length; n++)
            (i = Object.hasOwn(t, `$` + e[n].value)),
              e[n].selected !== i && (e[n].selected = i),
              i && r && (e[n].defaultSelected = !0);
        } else {
          for (n = `` + Bt(n), t = null, i = 0; i < e.length; i++) {
            if (e[i].value === n) {
              (e[i].selected = !0), r && (e[i].defaultSelected = !0);
              return;
            }
            t !== null || e[i].disabled || (t = e[i]);
          }
          t !== null && (t.selected = !0);
        }
      }
      function Qt(e, t, n) {
        if (
          t != null &&
          ((t = `` + Bt(t)), t !== e.value && (e.value = t), n == null)
        ) {
          e.defaultValue !== t && (e.defaultValue = t);
          return;
        }
        e.defaultValue = n == null ? `` : `` + Bt(n);
      }
      function A(e, t, n, r) {
        if (t == null) {
          if (r != null) {
            if (n != null) throw Error(i(92));
            if (ue(r)) {
              if (1 < r.length) throw Error(i(93));
              r = r[0];
            }
            n = r;
          }
          (n ??= ``), (t = n);
        }
        (n = Bt(t)),
          (e.defaultValue = n),
          (r = e.textContent),
          r === n && r !== `` && r !== null && (e.value = r),
          Ut(e);
      }
      function $t(e, t) {
        if (t) {
          var n = e.firstChild;
          if (n && n === e.lastChild && n.nodeType === 3) {
            n.nodeValue = t;
            return;
          }
        }
        e.textContent = t;
      }
      var en = new Set(
        `animationIterationCount aspectRatio borderImageOutset borderImageSlice borderImageWidth boxFlex boxFlexGroup boxOrdinalGroup columnCount columns flex flexGrow flexPositive flexShrink flexNegative flexOrder gridArea gridRow gridRowEnd gridRowSpan gridRowStart gridColumn gridColumnEnd gridColumnSpan gridColumnStart fontWeight lineClamp lineHeight opacity order orphans scale tabSize widows zIndex zoom fillOpacity floodOpacity stopOpacity strokeDasharray strokeDashoffset strokeMiterlimit strokeOpacity strokeWidth MozAnimationIterationCount MozBoxFlex MozBoxFlexGroup MozLineClamp msAnimationIterationCount msFlex msZoom msFlexGrow msFlexNegative msFlexOrder msFlexPositive msFlexShrink msGridColumn msGridColumnSpan msGridRow msGridRowSpan WebkitAnimationIterationCount WebkitBoxFlex WebKitBoxFlexGroup WebkitBoxOrdinalGroup WebkitColumnCount WebkitColumns WebkitFlex WebkitFlexGrow WebkitFlexPositive WebkitFlexShrink WebkitLineClamp`.split(
          ` `,
        ),
      );
      function tn(e, t, n) {
        var r = t.indexOf(`--`) === 0;
        n == null || typeof n == `boolean` || n === ``
          ? r
            ? e.setProperty(t, ``)
            : t === `float`
              ? (e.cssFloat = ``)
              : (e[t] = ``)
          : r
            ? e.setProperty(t, n)
            : typeof n != `number` || n === 0 || en.has(t)
              ? t === `float`
                ? (e.cssFloat = n)
                : (e[t] = (`` + n).trim())
              : (e[t] = n + `px`);
      }
      function nn(e, t, n) {
        if (t != null && typeof t != `object`) throw Error(i(62));
        if (((e = e.style), n != null)) {
          for (var r in n)
            !Object.hasOwn(n, r) ||
              (t != null && Object.hasOwn(t, r)) ||
              (r.indexOf(`--`) === 0
                ? e.setProperty(r, ``)
                : r === `float`
                  ? (e.cssFloat = ``)
                  : (e[r] = ``));
          for (var a in t)
            (r = t[a]), Object.hasOwn(t, a) && n[a] !== r && tn(e, a, r);
        } else for (var o in t) Object.hasOwn(t, o) && tn(e, o, t[o]);
      }
      function rn(e) {
        if (e.indexOf(`-`) === -1) return !1;
        switch (e) {
          case `annotation-xml`:
          case `color-profile`:
          case `font-face`:
          case `font-face-src`:
          case `font-face-uri`:
          case `font-face-format`:
          case `font-face-name`:
          case `missing-glyph`:
            return !1;
          default:
            return !0;
        }
      }
      var an = new Map([
          [`acceptCharset`, `accept-charset`],
          [`htmlFor`, `for`],
          [`httpEquiv`, `http-equiv`],
          [`crossOrigin`, `crossorigin`],
          [`accentHeight`, `accent-height`],
          [`alignmentBaseline`, `alignment-baseline`],
          [`arabicForm`, `arabic-form`],
          [`baselineShift`, `baseline-shift`],
          [`capHeight`, `cap-height`],
          [`clipPath`, `clip-path`],
          [`clipRule`, `clip-rule`],
          [`colorInterpolation`, `color-interpolation`],
          [`colorInterpolationFilters`, `color-interpolation-filters`],
          [`colorProfile`, `color-profile`],
          [`colorRendering`, `color-rendering`],
          [`dominantBaseline`, `dominant-baseline`],
          [`enableBackground`, `enable-background`],
          [`fillOpacity`, `fill-opacity`],
          [`fillRule`, `fill-rule`],
          [`floodColor`, `flood-color`],
          [`floodOpacity`, `flood-opacity`],
          [`fontFamily`, `font-family`],
          [`fontSize`, `font-size`],
          [`fontSizeAdjust`, `font-size-adjust`],
          [`fontStretch`, `font-stretch`],
          [`fontStyle`, `font-style`],
          [`fontVariant`, `font-variant`],
          [`fontWeight`, `font-weight`],
          [`glyphName`, `glyph-name`],
          [`glyphOrientationHorizontal`, `glyph-orientation-horizontal`],
          [`glyphOrientationVertical`, `glyph-orientation-vertical`],
          [`horizAdvX`, `horiz-adv-x`],
          [`horizOriginX`, `horiz-origin-x`],
          [`imageRendering`, `image-rendering`],
          [`letterSpacing`, `letter-spacing`],
          [`lightingColor`, `lighting-color`],
          [`markerEnd`, `marker-end`],
          [`markerMid`, `marker-mid`],
          [`markerStart`, `marker-start`],
          [`overlinePosition`, `overline-position`],
          [`overlineThickness`, `overline-thickness`],
          [`paintOrder`, `paint-order`],
          [`panose-1`, `panose-1`],
          [`pointerEvents`, `pointer-events`],
          [`renderingIntent`, `rendering-intent`],
          [`shapeRendering`, `shape-rendering`],
          [`stopColor`, `stop-color`],
          [`stopOpacity`, `stop-opacity`],
          [`strikethroughPosition`, `strikethrough-position`],
          [`strikethroughThickness`, `strikethrough-thickness`],
          [`strokeDasharray`, `stroke-dasharray`],
          [`strokeDashoffset`, `stroke-dashoffset`],
          [`strokeLinecap`, `stroke-linecap`],
          [`strokeLinejoin`, `stroke-linejoin`],
          [`strokeMiterlimit`, `stroke-miterlimit`],
          [`strokeOpacity`, `stroke-opacity`],
          [`strokeWidth`, `stroke-width`],
          [`textAnchor`, `text-anchor`],
          [`textDecoration`, `text-decoration`],
          [`textRendering`, `text-rendering`],
          [`transformOrigin`, `transform-origin`],
          [`underlinePosition`, `underline-position`],
          [`underlineThickness`, `underline-thickness`],
          [`unicodeBidi`, `unicode-bidi`],
          [`unicodeRange`, `unicode-range`],
          [`unitsPerEm`, `units-per-em`],
          [`vAlphabetic`, `v-alphabetic`],
          [`vHanging`, `v-hanging`],
          [`vIdeographic`, `v-ideographic`],
          [`vMathematical`, `v-mathematical`],
          [`vectorEffect`, `vector-effect`],
          [`vertAdvY`, `vert-adv-y`],
          [`vertOriginX`, `vert-origin-x`],
          [`vertOriginY`, `vert-origin-y`],
          [`wordSpacing`, `word-spacing`],
          [`writingMode`, `writing-mode`],
          [`xmlnsXlink`, `xmlns:xlink`],
          [`xHeight`, `x-height`],
        ]),
        on =
          /^[\u0000-\u001F ]*j[\r\n\t]*a[\r\n\t]*v[\r\n\t]*a[\r\n\t]*s[\r\n\t]*c[\r\n\t]*r[\r\n\t]*i[\r\n\t]*p[\r\n\t]*t[\r\n\t]*:/i;
      function sn(e) {
        return on.test(`` + e)
          ? `javascript:throw new Error('React has blocked a javascript: URL as a security precaution.')`
          : e;
      }
      function cn() {}
      var ln = null;
      function un(e) {
        return (
          (e = e.target || e.srcElement || window),
          e.correspondingUseElement && (e = e.correspondingUseElement),
          e.nodeType === 3 ? e.parentNode : e
        );
      }
      var j = null,
        dn = null;
      function fn(e) {
        var t = Tt(e);
        if (t && (e = t.stateNode)) {
          var n = e[gt] || null;
          switch (((e = t.stateNode), t.type)) {
            case `input`:
              if (
                (Jt(
                  e,
                  n.value,
                  n.defaultValue,
                  n.defaultValue,
                  n.checked,
                  n.defaultChecked,
                  n.type,
                  n.name,
                ),
                (t = n.name),
                n.type === `radio` && t != null)
              ) {
                for (n = e; n.parentNode; ) n = n.parentNode;
                for (
                  n = n.querySelectorAll(
                    `input[name="` + qt(`` + t) + `"][type="radio"]`,
                  ),
                    t = 0;
                  t < n.length;
                  t++
                ) {
                  var r = n[t];
                  if (r !== e && r.form === e.form) {
                    var a = r[gt] || null;
                    if (!a) throw Error(i(90));
                    Jt(
                      r,
                      a.value,
                      a.defaultValue,
                      a.defaultValue,
                      a.checked,
                      a.defaultChecked,
                      a.type,
                      a.name,
                    );
                  }
                }
                for (t = 0; t < n.length; t++)
                  (r = n[t]), r.form === e.form && Wt(r);
              }
              break;
            case `textarea`:
              Qt(e, n.value, n.defaultValue);
              break;
            case `select`:
              (t = n.value), t != null && Zt(e, !!n.multiple, t, !1);
          }
        }
      }
      var pn = !1;
      function mn(e, t, n) {
        if (pn) return e(t, n);
        pn = !0;
        try {
          return e(t);
        } finally {
          if (
            ((pn = !1),
            (j !== null || dn !== null) &&
              (bu(), j && ((t = j), (e = dn), (dn = j = null), fn(t), e)))
          )
            for (t = 0; t < e.length; t++) fn(e[t]);
        }
      }
      function hn(e, t) {
        var n = e.stateNode;
        if (n === null) return null;
        var r = n[gt] || null;
        if (r === null) return null;
        n = r[t];
        switch (t) {
          case `onClick`:
          case `onClickCapture`:
          case `onDoubleClick`:
          case `onDoubleClickCapture`:
          case `onMouseDown`:
          case `onMouseDownCapture`:
          case `onMouseMove`:
          case `onMouseMoveCapture`:
          case `onMouseUp`:
          case `onMouseUpCapture`:
          case `onMouseEnter`:
            (r = !r.disabled) ||
              ((e = e.type),
              (r = !(
                e === `button` ||
                e === `input` ||
                e === `select` ||
                e === `textarea`
              ))),
              (e = !r);
            break;
          default:
            e = !1;
        }
        if (e) return null;
        if (n && typeof n != `function`) throw Error(i(231, t, typeof n));
        return n;
      }
      var gn = !(
          typeof window > `u` ||
          window.document === void 0 ||
          window.document.createElement === void 0
        ),
        _n = !1;
      if (gn)
        try {
          var vn = {};
          Object.defineProperty(vn, "passive", {
            get: () => {
              _n = !0;
            },
          }),
            window.addEventListener(`test`, vn, vn),
            window.removeEventListener(`test`, vn, vn);
        } catch {
          _n = !1;
        }
      var yn = null,
        bn = null,
        xn = null;
      function Sn() {
        if (xn) return xn;
        var e,
          t = bn,
          n = t.length,
          r,
          i = `value` in yn ? yn.value : yn.textContent,
          a = i.length;
        for (e = 0; e < n && t[e] === i[e]; e++);
        var o = n - e;
        for (r = 1; r <= o && t[n - r] === i[a - r]; r++);
        return (xn = i.slice(e, 1 < r ? 1 - r : void 0));
      }
      function M(e) {
        var t = e.keyCode;
        return (
          `charCode` in e
            ? ((e = e.charCode), e === 0 && t === 13 && (e = 13))
            : (e = t),
          e === 10 && (e = 13),
          32 <= e || e === 13 ? e : 0
        );
      }
      function Cn() {
        return !0;
      }
      function wn() {
        return !1;
      }
      function Tn(e) {
        function t(t, n, r, i, a) {
          for (var o in ((this._reactName = t),
          (this._targetInst = r),
          (this.type = n),
          (this.nativeEvent = i),
          (this.target = a),
          (this.currentTarget = null),
          e))
            Object.hasOwn(e, o) && ((t = e[o]), (this[o] = t ? t(i) : i[o]));
          return (
            (this.isDefaultPrevented = (
              i.defaultPrevented == null
                ? !1 === i.returnValue
                : i.defaultPrevented
            )
              ? Cn
              : wn),
            (this.isPropagationStopped = wn),
            this
          );
        }
        return (
          h(t.prototype, {
            preventDefault: function () {
              this.defaultPrevented = !0;
              var e = this.nativeEvent;
              e &&
                (e.preventDefault
                  ? e.preventDefault()
                  : typeof e.returnValue != `unknown` && (e.returnValue = !1),
                (this.isDefaultPrevented = Cn));
            },
            stopPropagation: function () {
              var e = this.nativeEvent;
              e &&
                (e.stopPropagation
                  ? e.stopPropagation()
                  : typeof e.cancelBubble != `unknown` && (e.cancelBubble = !0),
                (this.isPropagationStopped = Cn));
            },
            persist: () => {},
            isPersistent: Cn,
          }),
          t
        );
      }
      var En = {
          eventPhase: 0,
          bubbles: 0,
          cancelable: 0,
          timeStamp: (e) => e.timeStamp || Date.now(),
          defaultPrevented: 0,
          isTrusted: 0,
        },
        Dn = Tn(En),
        On = h({}, En, { view: 0, detail: 0 }),
        kn = Tn(On),
        An,
        jn,
        Mn,
        Nn = h({}, On, {
          screenX: 0,
          screenY: 0,
          clientX: 0,
          clientY: 0,
          pageX: 0,
          pageY: 0,
          ctrlKey: 0,
          shiftKey: 0,
          altKey: 0,
          metaKey: 0,
          getModifierState: Wn,
          button: 0,
          buttons: 0,
          relatedTarget: (e) =>
            e.relatedTarget === void 0
              ? e.fromElement === e.srcElement
                ? e.toElement
                : e.fromElement
              : e.relatedTarget,
          movementX: (e) =>
            `movementX` in e
              ? e.movementX
              : (e !== Mn &&
                  (Mn && e.type === `mousemove`
                    ? ((An = e.screenX - Mn.screenX),
                      (jn = e.screenY - Mn.screenY))
                    : (jn = An = 0),
                  (Mn = e)),
                An),
          movementY: (e) => (`movementY` in e ? e.movementY : jn),
        }),
        Pn = Tn(Nn),
        Fn = Tn(h({}, Nn, { dataTransfer: 0 })),
        In = Tn(h({}, On, { relatedTarget: 0 })),
        Ln = Tn(
          h({}, En, { animationName: 0, elapsedTime: 0, pseudoElement: 0 }),
        ),
        Rn = Tn(
          h({}, En, {
            clipboardData: (e) =>
              `clipboardData` in e ? e.clipboardData : window.clipboardData,
          }),
        ),
        zn = Tn(h({}, En, { data: 0 })),
        Bn = {
          Esc: `Escape`,
          Spacebar: ` `,
          Left: `ArrowLeft`,
          Up: `ArrowUp`,
          Right: `ArrowRight`,
          Down: `ArrowDown`,
          Del: `Delete`,
          Win: `OS`,
          Menu: `ContextMenu`,
          Apps: `ContextMenu`,
          Scroll: `ScrollLock`,
          MozPrintableKey: `Unidentified`,
        },
        Vn = {
          8: `Backspace`,
          9: `Tab`,
          12: `Clear`,
          13: `Enter`,
          16: `Shift`,
          17: `Control`,
          18: `Alt`,
          19: `Pause`,
          20: `CapsLock`,
          27: `Escape`,
          32: ` `,
          33: `PageUp`,
          34: `PageDown`,
          35: `End`,
          36: `Home`,
          37: `ArrowLeft`,
          38: `ArrowUp`,
          39: `ArrowRight`,
          40: `ArrowDown`,
          45: `Insert`,
          46: `Delete`,
          112: `F1`,
          113: `F2`,
          114: `F3`,
          115: `F4`,
          116: `F5`,
          117: `F6`,
          118: `F7`,
          119: `F8`,
          120: `F9`,
          121: `F10`,
          122: `F11`,
          123: `F12`,
          144: `NumLock`,
          145: `ScrollLock`,
          224: `Meta`,
        },
        Hn = {
          Alt: `altKey`,
          Control: `ctrlKey`,
          Meta: `metaKey`,
          Shift: `shiftKey`,
        };
      function Un(e) {
        var t = this.nativeEvent;
        return t.getModifierState
          ? t.getModifierState(e)
          : (e = Hn[e])
            ? !!t[e]
            : !1;
      }
      function Wn() {
        return Un;
      }
      var Gn = Tn(
          h({}, On, {
            key: (e) => {
              if (e.key) {
                var t = Bn[e.key] || e.key;
                if (t !== `Unidentified`) return t;
              }
              return e.type === `keypress`
                ? ((e = M(e)), e === 13 ? `Enter` : String.fromCharCode(e))
                : e.type === `keydown` || e.type === `keyup`
                  ? Vn[e.keyCode] || `Unidentified`
                  : ``;
            },
            code: 0,
            location: 0,
            ctrlKey: 0,
            shiftKey: 0,
            altKey: 0,
            metaKey: 0,
            repeat: 0,
            locale: 0,
            getModifierState: Wn,
            charCode: (e) => (e.type === `keypress` ? M(e) : 0),
            keyCode: (e) =>
              e.type === `keydown` || e.type === `keyup` ? e.keyCode : 0,
            which: (e) =>
              e.type === `keypress`
                ? M(e)
                : e.type === `keydown` || e.type === `keyup`
                  ? e.keyCode
                  : 0,
          }),
        ),
        Kn = Tn(
          h({}, Nn, {
            pointerId: 0,
            width: 0,
            height: 0,
            pressure: 0,
            tangentialPressure: 0,
            tiltX: 0,
            tiltY: 0,
            twist: 0,
            pointerType: 0,
            isPrimary: 0,
          }),
        ),
        qn = Tn(
          h({}, On, {
            touches: 0,
            targetTouches: 0,
            changedTouches: 0,
            altKey: 0,
            metaKey: 0,
            ctrlKey: 0,
            shiftKey: 0,
            getModifierState: Wn,
          }),
        ),
        Jn = Tn(
          h({}, En, { propertyName: 0, elapsedTime: 0, pseudoElement: 0 }),
        ),
        Yn = Tn(
          h({}, Nn, {
            deltaX: (e) =>
              `deltaX` in e
                ? e.deltaX
                : `wheelDeltaX` in e
                  ? -e.wheelDeltaX
                  : 0,
            deltaY: (e) =>
              `deltaY` in e
                ? e.deltaY
                : `wheelDeltaY` in e
                  ? -e.wheelDeltaY
                  : `wheelDelta` in e
                    ? -e.wheelDelta
                    : 0,
            deltaZ: 0,
            deltaMode: 0,
          }),
        ),
        Xn = Tn(h({}, En, { newState: 0, oldState: 0 })),
        Zn = [9, 13, 27, 32],
        Qn = gn && `CompositionEvent` in window,
        $n = null;
      gn && `documentMode` in document && ($n = document.documentMode);
      var er = gn && `TextEvent` in window && !$n,
        tr = gn && (!Qn || ($n && 8 < $n && 11 >= $n)),
        nr = ` `,
        rr = !1;
      function ir(e, t) {
        switch (e) {
          case `keyup`:
            return Zn.indexOf(t.keyCode) !== -1;
          case `keydown`:
            return t.keyCode !== 229;
          case `keypress`:
          case `mousedown`:
          case `focusout`:
            return !0;
          default:
            return !1;
        }
      }
      function ar(e) {
        return (
          (e = e.detail), typeof e == `object` && `data` in e ? e.data : null
        );
      }
      var or = !1;
      function sr(e, t) {
        switch (e) {
          case `compositionend`:
            return ar(t);
          case `keypress`:
            return t.which === 32 ? ((rr = !0), nr) : null;
          case `textInput`:
            return (e = t.data), e === nr && rr ? null : e;
          default:
            return null;
        }
      }
      function cr(e, t) {
        if (or)
          return e === `compositionend` || (!Qn && ir(e, t))
            ? ((e = Sn()), (xn = bn = yn = null), (or = !1), e)
            : null;
        switch (e) {
          case `paste`:
            return null;
          case `keypress`:
            if (
              !(t.ctrlKey || t.altKey || t.metaKey) ||
              (t.ctrlKey && t.altKey)
            ) {
              if (t.char && 1 < t.char.length) return t.char;
              if (t.which) return String.fromCharCode(t.which);
            }
            return null;
          case `compositionend`:
            return tr && t.locale !== `ko` ? null : t.data;
          default:
            return null;
        }
      }
      var lr = {
        color: !0,
        date: !0,
        datetime: !0,
        "datetime-local": !0,
        email: !0,
        month: !0,
        number: !0,
        password: !0,
        range: !0,
        search: !0,
        tel: !0,
        text: !0,
        time: !0,
        url: !0,
        week: !0,
      };
      function ur(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return t === `input` ? !!lr[e.type] : t === `textarea`;
      }
      function dr(e, t, n, r) {
        j ? (dn ? dn.push(r) : (dn = [r])) : (j = r),
          (t = Ed(t, `onChange`)),
          0 < t.length &&
            ((n = new Dn(`onChange`, `change`, null, n, r)),
            e.push({ event: n, listeners: t }));
      }
      var fr = null,
        pr = null;
      function mr(e) {
        yd(e, 0);
      }
      function hr(e) {
        if (Wt(Et(e))) return e;
      }
      function gr(e, t) {
        if (e === `change`) return t;
      }
      var _r = !1;
      if (gn) {
        var vr;
        if (gn) {
          var yr = `oninput` in document;
          if (!yr) {
            var br = document.createElement(`div`);
            br.setAttribute(`oninput`, `return;`),
              (yr = typeof br.oninput == `function`);
          }
          vr = yr;
        } else vr = !1;
        _r = vr && (!document.documentMode || 9 < document.documentMode);
      }
      function xr() {
        fr && (fr.detachEvent(`onpropertychange`, Sr), (pr = fr = null));
      }
      function Sr(e) {
        if (e.propertyName === `value` && hr(pr)) {
          var t = [];
          dr(t, pr, e, un(e)), mn(mr, t);
        }
      }
      function Cr(e, t, n) {
        e === `focusin`
          ? (xr(), (fr = t), (pr = n), fr.attachEvent(`onpropertychange`, Sr))
          : e === `focusout` && xr();
      }
      function wr(e) {
        if (e === `selectionchange` || e === `keyup` || e === `keydown`)
          return hr(pr);
      }
      function Tr(e, t) {
        if (e === `click`) return hr(t);
      }
      function Er(e, t) {
        if (e === `input` || e === `change`) return hr(t);
      }
      function Dr(e, t) {
        return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
      }
      var Or = typeof Object.is == `function` ? Object.is : Dr;
      function kr(e, t) {
        if (Or(e, t)) return !0;
        if (typeof e != `object` || !e || typeof t != `object` || !t) return !1;
        var n = Object.keys(e),
          r = Object.keys(t);
        if (n.length !== r.length) return !1;
        for (r = 0; r < n.length; r++) {
          var i = n[r];
          if (!k.call(t, i) || !Or(e[i], t[i])) return !1;
        }
        return !0;
      }
      function Ar(e) {
        for (; e && e.firstChild; ) e = e.firstChild;
        return e;
      }
      function jr(e, t) {
        var n = Ar(e);
        e = 0;
        for (var r; n; ) {
          if (n.nodeType === 3) {
            if (((r = e + n.textContent.length), e <= t && r >= t))
              return { node: n, offset: t - e };
            e = r;
          }
          a: {
            for (; n; ) {
              if (n.nextSibling) {
                n = n.nextSibling;
                break a;
              }
              n = n.parentNode;
            }
            n = void 0;
          }
          n = Ar(n);
        }
      }
      function Mr(e, t) {
        return e && t
          ? e === t
            ? !0
            : e && e.nodeType === 3
              ? !1
              : t && t.nodeType === 3
                ? Mr(e, t.parentNode)
                : `contains` in e
                  ? e.contains(t)
                  : e.compareDocumentPosition
                    ? !!(e.compareDocumentPosition(t) & 16)
                    : !1
          : !1;
      }
      function Nr(e) {
        e =
          e != null &&
          e.ownerDocument != null &&
          e.ownerDocument.defaultView != null
            ? e.ownerDocument.defaultView
            : window;
        for (var t = Gt(e.document); t instanceof e.HTMLIFrameElement; ) {
          try {
            var n = typeof t.contentWindow.location.href == `string`;
          } catch {
            n = !1;
          }
          if (n) e = t.contentWindow;
          else break;
          t = Gt(e.document);
        }
        return t;
      }
      function Pr(e) {
        var t = e && e.nodeName && e.nodeName.toLowerCase();
        return (
          t &&
          ((t === `input` &&
            (e.type === `text` ||
              e.type === `search` ||
              e.type === `tel` ||
              e.type === `url` ||
              e.type === `password`)) ||
            t === `textarea` ||
            e.contentEditable === `true`)
        );
      }
      var Fr = gn && `documentMode` in document && 11 >= document.documentMode,
        Ir = null,
        Lr = null,
        Rr = null,
        zr = !1;
      function Br(e, t, n) {
        var r =
          n.window === n ? n.document : n.nodeType === 9 ? n : n.ownerDocument;
        zr ||
          Ir == null ||
          Ir !== Gt(r) ||
          ((r = Ir),
          `selectionStart` in r && Pr(r)
            ? (r = { start: r.selectionStart, end: r.selectionEnd })
            : ((r = (
                (r.ownerDocument && r.ownerDocument.defaultView) ||
                window
              ).getSelection()),
              (r = {
                anchorNode: r.anchorNode,
                anchorOffset: r.anchorOffset,
                focusNode: r.focusNode,
                focusOffset: r.focusOffset,
              })),
          (Rr && kr(Rr, r)) ||
            ((Rr = r),
            (r = Ed(Lr, `onSelect`)),
            0 < r.length &&
              ((t = new Dn(`onSelect`, `select`, null, t, n)),
              e.push({ event: t, listeners: r }),
              (t.target = Ir))));
      }
      function Vr(e, t) {
        var n = {};
        return (
          (n[e.toLowerCase()] = t.toLowerCase()),
          (n[`Webkit` + e] = `webkit` + t),
          (n[`Moz` + e] = `moz` + t),
          n
        );
      }
      var Hr = {
          animationend: Vr(`Animation`, `AnimationEnd`),
          animationiteration: Vr(`Animation`, `AnimationIteration`),
          animationstart: Vr(`Animation`, `AnimationStart`),
          transitionrun: Vr(`Transition`, `TransitionRun`),
          transitionstart: Vr(`Transition`, `TransitionStart`),
          transitioncancel: Vr(`Transition`, `TransitionCancel`),
          transitionend: Vr(`Transition`, `TransitionEnd`),
        },
        Ur = {},
        Wr = {};
      gn &&
        ((Wr = document.createElement(`div`).style),
        `AnimationEvent` in window ||
          (delete Hr.animationend.animation,
          delete Hr.animationiteration.animation,
          delete Hr.animationstart.animation),
        `TransitionEvent` in window || delete Hr.transitionend.transition);
      function Gr(e) {
        if (Ur[e]) return Ur[e];
        if (!Hr[e]) return e;
        var t = Hr[e],
          n;
        for (n in t) if (Object.hasOwn(t, n) && n in Wr) return (Ur[e] = t[n]);
        return e;
      }
      var Kr = Gr(`animationend`),
        qr = Gr(`animationiteration`),
        Jr = Gr(`animationstart`),
        Yr = Gr(`transitionrun`),
        Xr = Gr(`transitionstart`),
        Zr = Gr(`transitioncancel`),
        Qr = Gr(`transitionend`),
        $r = new Map(),
        ei =
          `abort auxClick beforeToggle cancel canPlay canPlayThrough click close contextMenu copy cut drag dragEnd dragEnter dragExit dragLeave dragOver dragStart drop durationChange emptied encrypted ended error gotPointerCapture input invalid keyDown keyPress keyUp load loadedData loadedMetadata loadStart lostPointerCapture mouseDown mouseMove mouseOut mouseOver mouseUp paste pause play playing pointerCancel pointerDown pointerMove pointerOut pointerOver pointerUp progress rateChange reset resize seeked seeking stalled submit suspend timeUpdate touchCancel touchEnd touchStart volumeChange scroll toggle touchMove waiting wheel`.split(
            ` `,
          );
      ei.push(`scrollEnd`);
      function N(e, t) {
        $r.set(e, t), jt(t, [e]);
      }
      var ti =
          typeof reportError == `function`
            ? reportError
            : (e) => {
                if (
                  typeof window == `object` &&
                  typeof window.ErrorEvent == `function`
                ) {
                  var t = new window.ErrorEvent(`error`, {
                    bubbles: !0,
                    cancelable: !0,
                    message:
                      typeof e == `object` && e && typeof e.message == `string`
                        ? String(e.message)
                        : String(e),
                    error: e,
                  });
                  if (!window.dispatchEvent(t)) return;
                } else if (
                  typeof process == `object` &&
                  typeof process.emit == `function`
                ) {
                  process.emit(`uncaughtException`, e);
                  return;
                }
                console.error(e);
              },
        P = [],
        ni = 0,
        ri = 0;
      function ii() {
        for (var e = ni, t = (ri = ni = 0); t < e; ) {
          var n = P[t];
          P[t++] = null;
          var r = P[t];
          P[t++] = null;
          var i = P[t];
          P[t++] = null;
          var a = P[t];
          if (((P[t++] = null), r !== null && i !== null)) {
            var o = r.pending;
            o === null ? (i.next = i) : ((i.next = o.next), (o.next = i)),
              (r.pending = i);
          }
          a !== 0 && ci(n, i, a);
        }
      }
      function ai(e, t, n, r) {
        (P[ni++] = e),
          (P[ni++] = t),
          (P[ni++] = n),
          (P[ni++] = r),
          (ri |= r),
          (e.lanes |= r),
          (e = e.alternate),
          e !== null && (e.lanes |= r);
      }
      function oi(e, t, n, r) {
        return ai(e, t, n, r), li(e);
      }
      function si(e, t) {
        return ai(e, null, null, t), li(e);
      }
      function ci(e, t, n) {
        e.lanes |= n;
        var r = e.alternate;
        r !== null && (r.lanes |= n);
        for (var i = !1, a = e.return; a !== null; )
          (a.childLanes |= n),
            (r = a.alternate),
            r !== null && (r.childLanes |= n),
            a.tag === 22 &&
              ((e = a.stateNode), e === null || e._visibility & 1 || (i = !0)),
            (e = a),
            (a = a.return);
        return e.tag === 3
          ? ((a = e.stateNode),
            i &&
              t !== null &&
              ((i = 31 - Ke(n)),
              (e = a.hiddenUpdates),
              (r = e[i]),
              r === null ? (e[i] = [t]) : r.push(t),
              (t.lane = n | 536870912)),
            a)
          : null;
      }
      function li(e) {
        if (50 < du) throw ((du = 0), (fu = null), Error(i(185)));
        for (var t = e.return; t !== null; ) (e = t), (t = e.return);
        return e.tag === 3 ? e.stateNode : null;
      }
      var ui = {};
      function di(e, t, n, r) {
        (this.tag = e),
          (this.key = n),
          (this.sibling =
            this.child =
            this.return =
            this.stateNode =
            this.type =
            this.elementType =
              null),
          (this.index = 0),
          (this.refCleanup = this.ref = null),
          (this.pendingProps = t),
          (this.dependencies =
            this.memoizedState =
            this.updateQueue =
            this.memoizedProps =
              null),
          (this.mode = r),
          (this.subtreeFlags = this.flags = 0),
          (this.deletions = null),
          (this.childLanes = this.lanes = 0),
          (this.alternate = null);
      }
      function fi(e, t, n, r) {
        return new di(e, t, n, r);
      }
      function pi(e) {
        return (e = e.prototype), !(!e || !e.isReactComponent);
      }
      function mi(e, t) {
        var n = e.alternate;
        return (
          n === null
            ? ((n = fi(e.tag, t, e.key, e.mode)),
              (n.elementType = e.elementType),
              (n.type = e.type),
              (n.stateNode = e.stateNode),
              (n.alternate = e),
              (e.alternate = n))
            : ((n.pendingProps = t),
              (n.type = e.type),
              (n.flags = 0),
              (n.subtreeFlags = 0),
              (n.deletions = null)),
          (n.flags = e.flags & 65011712),
          (n.childLanes = e.childLanes),
          (n.lanes = e.lanes),
          (n.child = e.child),
          (n.memoizedProps = e.memoizedProps),
          (n.memoizedState = e.memoizedState),
          (n.updateQueue = e.updateQueue),
          (t = e.dependencies),
          (n.dependencies =
            t === null
              ? null
              : { lanes: t.lanes, firstContext: t.firstContext }),
          (n.sibling = e.sibling),
          (n.index = e.index),
          (n.ref = e.ref),
          (n.refCleanup = e.refCleanup),
          n
        );
      }
      function hi(e, t) {
        e.flags &= 65011714;
        var n = e.alternate;
        return (
          n === null
            ? ((e.childLanes = 0),
              (e.lanes = t),
              (e.child = null),
              (e.subtreeFlags = 0),
              (e.memoizedProps = null),
              (e.memoizedState = null),
              (e.updateQueue = null),
              (e.dependencies = null),
              (e.stateNode = null))
            : ((e.childLanes = n.childLanes),
              (e.lanes = n.lanes),
              (e.child = n.child),
              (e.subtreeFlags = 0),
              (e.deletions = null),
              (e.memoizedProps = n.memoizedProps),
              (e.memoizedState = n.memoizedState),
              (e.updateQueue = n.updateQueue),
              (e.type = n.type),
              (t = n.dependencies),
              (e.dependencies =
                t === null
                  ? null
                  : { lanes: t.lanes, firstContext: t.firstContext })),
          e
        );
      }
      function gi(e, t, n, r, a, o) {
        var s = 0;
        if (((r = e), typeof e == `function`)) pi(e) && (s = 1);
        else if (typeof e == `string`)
          s = Uf(e, n, ge.current)
            ? 26
            : e === `html` || e === `head` || e === `body`
              ? 27
              : 5;
        else
          a: switch (e) {
            case oe:
              return (
                (e = fi(31, n, t, a)), (e.elementType = oe), (e.lanes = o), e
              );
            case y:
              return _i(n.children, a, o, t);
            case b:
              (s = 8), (a |= 24);
              break;
            case x:
              return (
                (e = fi(12, n, t, a | 2)), (e.elementType = x), (e.lanes = o), e
              );
            case ne:
              return (
                (e = fi(13, n, t, a)), (e.elementType = ne), (e.lanes = o), e
              );
            case re:
              return (
                (e = fi(19, n, t, a)), (e.elementType = re), (e.lanes = o), e
              );
            default:
              if (typeof e == `object` && e)
                switch (e.$$typeof) {
                  case te:
                    s = 10;
                    break a;
                  case ee:
                    s = 9;
                    break a;
                  case S:
                    s = 11;
                    break a;
                  case ie:
                    s = 14;
                    break a;
                  case ae:
                    (s = 16), (r = null);
                    break a;
                }
              (s = 29),
                (n = Error(i(130, e === null ? `null` : typeof e, ``))),
                (r = null);
          }
        return (
          (t = fi(s, n, t, a)),
          (t.elementType = e),
          (t.type = r),
          (t.lanes = o),
          t
        );
      }
      function _i(e, t, n, r) {
        return (e = fi(7, e, r, t)), (e.lanes = n), e;
      }
      function vi(e, t, n) {
        return (e = fi(6, e, null, t)), (e.lanes = n), e;
      }
      function yi(e) {
        var t = fi(18, null, null, 0);
        return (t.stateNode = e), t;
      }
      function bi(e, t, n) {
        return (
          (t = fi(4, e.children === null ? [] : e.children, e.key, t)),
          (t.lanes = n),
          (t.stateNode = {
            containerInfo: e.containerInfo,
            pendingChildren: null,
            implementation: e.implementation,
          }),
          t
        );
      }
      var xi = new WeakMap();
      function Si(e, t) {
        if (typeof e == `object` && e) {
          var n = xi.get(e);
          return n === void 0
            ? ((t = { value: e, source: t, stack: ke(t) }), xi.set(e, t), t)
            : n;
        }
        return { value: e, source: t, stack: ke(t) };
      }
      var Ci = [],
        wi = 0,
        Ti = null,
        Ei = 0,
        Di = [],
        Oi = 0,
        ki = null,
        Ai = 1,
        ji = ``;
      function Mi(e, t) {
        (Ci[wi++] = Ei), (Ci[wi++] = Ti), (Ti = e), (Ei = t);
      }
      function Ni(e, t, n) {
        (Di[Oi++] = Ai), (Di[Oi++] = ji), (Di[Oi++] = ki), (ki = e);
        var r = Ai;
        e = ji;
        var i = 32 - Ke(r) - 1;
        (r &= ~(1 << i)), (n += 1);
        var a = 32 - Ke(t) + i;
        if (30 < a) {
          var o = i - (i % 5);
          (a = (r & ((1 << o) - 1)).toString(32)),
            (r >>= o),
            (i -= o),
            (Ai = (1 << (32 - Ke(t) + i)) | (n << i) | r),
            (ji = a + e);
        } else (Ai = (1 << a) | (n << i) | r), (ji = e);
      }
      function Pi(e) {
        e.return !== null && (Mi(e, 1), Ni(e, 1, 0));
      }
      function Fi(e) {
        for (; e === Ti; )
          (Ti = Ci[--wi]), (Ci[wi] = null), (Ei = Ci[--wi]), (Ci[wi] = null);
        for (; e === ki; )
          (ki = Di[--Oi]),
            (Di[Oi] = null),
            (ji = Di[--Oi]),
            (Di[Oi] = null),
            (Ai = Di[--Oi]),
            (Di[Oi] = null);
      }
      function Ii(e, t) {
        (Di[Oi++] = Ai),
          (Di[Oi++] = ji),
          (Di[Oi++] = ki),
          (Ai = t.id),
          (ji = t.overflow),
          (ki = e);
      }
      var Li = null,
        F = null,
        I = !1,
        Ri = null,
        zi = !1,
        Bi = Error(i(519));
      function Vi(e) {
        throw (
          (qi(
            Si(
              Error(
                i(
                  418,
                  1 < arguments.length &&
                    arguments[1] !== void 0 &&
                    arguments[1]
                    ? `text`
                    : `HTML`,
                  ``,
                ),
              ),
              e,
            ),
          ),
          Bi)
        );
      }
      function Hi(e) {
        var t = e.stateNode,
          n = e.type,
          r = e.memoizedProps;
        switch (((t[ht] = e), (t[gt] = r), n)) {
          case `dialog`:
            Q(`cancel`, t), Q(`close`, t);
            break;
          case `iframe`:
          case `object`:
          case `embed`:
            Q(`load`, t);
            break;
          case `video`:
          case `audio`:
            for (n = 0; n < _d.length; n++) Q(_d[n], t);
            break;
          case `source`:
            Q(`error`, t);
            break;
          case `img`:
          case `image`:
          case `link`:
            Q(`error`, t), Q(`load`, t);
            break;
          case `details`:
            Q(`toggle`, t);
            break;
          case `input`:
            Q(`invalid`, t),
              Yt(
                t,
                r.value,
                r.defaultValue,
                r.checked,
                r.defaultChecked,
                r.type,
                r.name,
                !0,
              );
            break;
          case `select`:
            Q(`invalid`, t);
            break;
          case `textarea`:
            Q(`invalid`, t), A(t, r.value, r.defaultValue, r.children);
        }
        (n = r.children),
          (typeof n != `string` &&
            typeof n != `number` &&
            typeof n != `bigint`) ||
          t.textContent === `` + n ||
          !0 === r.suppressHydrationWarning ||
          Md(t.textContent, n)
            ? (r.popover != null && (Q(`beforetoggle`, t), Q(`toggle`, t)),
              r.onScroll != null && Q(`scroll`, t),
              r.onScrollEnd != null && Q(`scrollend`, t),
              r.onClick != null && (t.onclick = cn),
              (t = !0))
            : (t = !1),
          t || Vi(e, !0);
      }
      function Ui(e) {
        for (Li = e.return; Li; )
          switch (Li.tag) {
            case 5:
            case 31:
            case 13:
              zi = !1;
              return;
            case 27:
            case 3:
              zi = !0;
              return;
            default:
              Li = Li.return;
          }
      }
      function Wi(e) {
        if (e !== Li) return !1;
        if (!I) return Ui(e), (I = !0), !1;
        var t = e.tag,
          n;
        if (
          ((n = t !== 3 && t !== 27) &&
            ((n = t === 5) &&
              ((n = e.type),
              (n =
                !(n !== `form` && n !== `button`) ||
                Ud(e.type, e.memoizedProps))),
            (n = !n)),
          n && F && Vi(e),
          Ui(e),
          t === 13)
        ) {
          if (
            ((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e)
          )
            throw Error(i(317));
          F = uf(e);
        } else if (t === 31) {
          if (
            ((e = e.memoizedState), (e = e === null ? null : e.dehydrated), !e)
          )
            throw Error(i(317));
          F = uf(e);
        } else
          t === 27
            ? ((t = F), Zd(e.type) ? ((e = lf), (lf = null), (F = e)) : (F = t))
            : (F = Li ? cf(e.stateNode.nextSibling) : null);
        return !0;
      }
      function Gi() {
        (F = Li = null), (I = !1);
      }
      function Ki() {
        var e = Ri;
        return (
          e !== null &&
            (Zl === null ? (Zl = e) : Zl.push.apply(Zl, e), (Ri = null)),
          e
        );
      }
      function qi(e) {
        Ri === null ? (Ri = [e]) : Ri.push(e);
      }
      var Ji = me(null),
        Yi = null,
        Xi = null;
      function Zi(e, t, n) {
        D(Ji, t._currentValue), (t._currentValue = n);
      }
      function Qi(e) {
        (e._currentValue = Ji.current), he(Ji);
      }
      function $i(e, t, n) {
        for (; e !== null; ) {
          var r = e.alternate;
          if (
            ((e.childLanes & t) === t
              ? r !== null && (r.childLanes & t) !== t && (r.childLanes |= t)
              : ((e.childLanes |= t), r !== null && (r.childLanes |= t)),
            e === n)
          )
            break;
          e = e.return;
        }
      }
      function ea(e, t, n, r) {
        var a = e.child;
        for (a !== null && (a.return = e); a !== null; ) {
          var o = a.dependencies;
          if (o !== null) {
            var s = a.child;
            o = o.firstContext;
            a: for (; o !== null; ) {
              var c = o;
              o = a;
              for (var l = 0; l < t.length; l++)
                if (c.context === t[l]) {
                  (o.lanes |= n),
                    (c = o.alternate),
                    c !== null && (c.lanes |= n),
                    $i(o.return, n, e),
                    r || (s = null);
                  break a;
                }
              o = c.next;
            }
          } else if (a.tag === 18) {
            if (((s = a.return), s === null)) throw Error(i(341));
            (s.lanes |= n),
              (o = s.alternate),
              o !== null && (o.lanes |= n),
              $i(s, n, e),
              (s = null);
          } else s = a.child;
          if (s !== null) s.return = a;
          else
            for (s = a; s !== null; ) {
              if (s === e) {
                s = null;
                break;
              }
              if (((a = s.sibling), a !== null)) {
                (a.return = s.return), (s = a);
                break;
              }
              s = s.return;
            }
          a = s;
        }
      }
      function ta(e, t, n, r) {
        e = null;
        for (var a = t, o = !1; a !== null; ) {
          if (!o) {
            if (a.flags & 524288) o = !0;
            else if (a.flags & 262144) break;
          }
          if (a.tag === 10) {
            var s = a.alternate;
            if (s === null) throw Error(i(387));
            if (((s = s.memoizedProps), s !== null)) {
              var c = a.type;
              Or(a.pendingProps.value, s.value) ||
                (e === null ? (e = [c]) : e.push(c));
            }
          } else if (a === ye.current) {
            if (((s = a.alternate), s === null)) throw Error(i(387));
            s.memoizedState.memoizedState !== a.memoizedState.memoizedState &&
              (e === null ? (e = [Qf]) : e.push(Qf));
          }
          a = a.return;
        }
        e !== null && ea(t, e, n, r), (t.flags |= 262144);
      }
      function na(e) {
        for (e = e.firstContext; e !== null; ) {
          if (!Or(e.context._currentValue, e.memoizedValue)) return !0;
          e = e.next;
        }
        return !1;
      }
      function ra(e) {
        (Yi = e),
          (Xi = null),
          (e = e.dependencies),
          e !== null && (e.firstContext = null);
      }
      function ia(e) {
        return oa(Yi, e);
      }
      function aa(e, t) {
        return Yi === null && ra(e), oa(e, t);
      }
      function oa(e, t) {
        var n = t._currentValue;
        if (((t = { context: t, memoizedValue: n, next: null }), Xi === null)) {
          if (e === null) throw Error(i(308));
          (Xi = t),
            (e.dependencies = { lanes: 0, firstContext: t }),
            (e.flags |= 524288);
        } else Xi = Xi.next = t;
        return n;
      }
      var sa =
          typeof AbortController < `u`
            ? AbortController
            : function () {
                var e = [],
                  t = (this.signal = {
                    aborted: !1,
                    addEventListener: (t, n) => {
                      e.push(n);
                    },
                  });
                this.abort = () => {
                  (t.aborted = !0), e.forEach((e) => e());
                };
              },
        ca = t.unstable_scheduleCallback,
        la = t.unstable_NormalPriority,
        ua = {
          $$typeof: te,
          Consumer: null,
          Provider: null,
          _currentValue: null,
          _currentValue2: null,
          _threadCount: 0,
        };
      function da() {
        return { controller: new sa(), data: new Map(), refCount: 0 };
      }
      function fa(e) {
        e.refCount--,
          e.refCount === 0 &&
            ca(la, () => {
              e.controller.abort();
            });
      }
      var pa = null,
        ma = 0,
        ha = 0,
        ga = null;
      function _a(e, t) {
        if (pa === null) {
          var n = (pa = []);
          (ma = 0),
            (ha = dd()),
            (ga = {
              status: `pending`,
              value: void 0,
              then: (e) => {
                n.push(e);
              },
            });
        }
        return ma++, t.then(va, va), t;
      }
      function va() {
        if (--ma === 0 && pa !== null) {
          ga !== null && (ga.status = `fulfilled`);
          var e = pa;
          (pa = null), (ha = 0), (ga = null);
          for (var t = 0; t < e.length; t++) (0, e[t])();
        }
      }
      function ya(e, t) {
        var n = [],
          r = {
            status: `pending`,
            value: null,
            reason: null,
            then: (e) => {
              n.push(e);
            },
          };
        return (
          e.then(
            () => {
              (r.status = `fulfilled`), (r.value = t);
              for (var e = 0; e < n.length; e++) (0, n[e])(t);
            },
            (e) => {
              for (
                r.status = `rejected`, r.reason = e, e = 0;
                e < n.length;
                e++
              )
                (0, n[e])(void 0);
            },
          ),
          r
        );
      }
      var ba = T.S;
      T.S = (e, t) => {
        (eu = Pe()),
          typeof t == `object` && t && typeof t.then == `function` && _a(e, t),
          ba !== null && ba(e, t);
      };
      var xa = me(null);
      function Sa() {
        var e = xa.current;
        return e === null ? q.pooledCache : e;
      }
      function Ca(e, t) {
        t === null ? D(xa, xa.current) : D(xa, t.pool);
      }
      function wa() {
        var e = Sa();
        return e === null ? null : { parent: ua._currentValue, pool: e };
      }
      var Ta = Error(i(460)),
        Ea = Error(i(474)),
        Da = Error(i(542)),
        Oa = { then: () => {} };
      function ka(e) {
        return (e = e.status), e === `fulfilled` || e === `rejected`;
      }
      function Aa(e, t, n) {
        switch (
          ((n = e[n]),
          n === void 0 ? e.push(t) : n !== t && (t.then(cn, cn), (t = n)),
          t.status)
        ) {
          case `fulfilled`:
            return t.value;
          case `rejected`:
            throw ((e = t.reason), Pa(e), e);
          default:
            if (typeof t.status == `string`) t.then(cn, cn);
            else {
              if (((e = q), e !== null && 100 < e.shellSuspendCounter))
                throw Error(i(482));
              (e = t),
                (e.status = `pending`),
                e.then(
                  (e) => {
                    if (t.status === `pending`) {
                      var n = t;
                      (n.status = `fulfilled`), (n.value = e);
                    }
                  },
                  (e) => {
                    if (t.status === `pending`) {
                      var n = t;
                      (n.status = `rejected`), (n.reason = e);
                    }
                  },
                );
            }
            switch (t.status) {
              case `fulfilled`:
                return t.value;
              case `rejected`:
                throw ((e = t.reason), Pa(e), e);
            }
            throw ((Ma = t), Ta);
        }
      }
      function ja(e) {
        try {
          var t = e._init;
          return t(e._payload);
        } catch (e) {
          throw typeof e == `object` && e && typeof e.then == `function`
            ? ((Ma = e), Ta)
            : e;
        }
      }
      var Ma = null;
      function Na() {
        if (Ma === null) throw Error(i(459));
        var e = Ma;
        return (Ma = null), e;
      }
      function Pa(e) {
        if (e === Ta || e === Da) throw Error(i(483));
      }
      var Fa = null,
        Ia = 0;
      function La(e) {
        var t = Ia;
        return (Ia += 1), Fa === null && (Fa = []), Aa(Fa, e, t);
      }
      function Ra(e, t) {
        (t = t.props.ref), (e.ref = t === void 0 ? null : t);
      }
      function za(e, t) {
        throw t.$$typeof === g
          ? Error(i(525))
          : ((e = Object.prototype.toString.call(t)),
            Error(
              i(
                31,
                e === `[object Object]`
                  ? `object with keys {` + Object.keys(t).join(`, `) + `}`
                  : e,
              ),
            ));
      }
      function Ba(e) {
        function t(t, n) {
          if (e) {
            var r = t.deletions;
            r === null ? ((t.deletions = [n]), (t.flags |= 16)) : r.push(n);
          }
        }
        function n(n, r) {
          if (!e) return null;
          for (; r !== null; ) t(n, r), (r = r.sibling);
          return null;
        }
        function r(e) {
          for (var t = new Map(); e !== null; )
            e.key === null ? t.set(e.index, e) : t.set(e.key, e),
              (e = e.sibling);
          return t;
        }
        function a(e, t) {
          return (e = mi(e, t)), (e.index = 0), (e.sibling = null), e;
        }
        function o(t, n, r) {
          return (
            (t.index = r),
            e
              ? ((r = t.alternate),
                r === null
                  ? ((t.flags |= 67108866), n)
                  : ((r = r.index), r < n ? ((t.flags |= 67108866), n) : r))
              : ((t.flags |= 1048576), n)
          );
        }
        function s(t) {
          return e && t.alternate === null && (t.flags |= 67108866), t;
        }
        function c(e, t, n, r) {
          return t === null || t.tag !== 6
            ? ((t = vi(n, e.mode, r)), (t.return = e), t)
            : ((t = a(t, n)), (t.return = e), t);
        }
        function l(e, t, n, r) {
          var i = n.type;
          return i === y
            ? d(e, t, n.props.children, r, n.key)
            : t !== null &&
                (t.elementType === i ||
                  (typeof i == `object` &&
                    i &&
                    i.$$typeof === ae &&
                    ja(i) === t.type))
              ? ((t = a(t, n.props)), Ra(t, n), (t.return = e), t)
              : ((t = gi(n.type, n.key, n.props, null, e.mode, r)),
                Ra(t, n),
                (t.return = e),
                t);
        }
        function u(e, t, n, r) {
          return t === null ||
            t.tag !== 4 ||
            t.stateNode.containerInfo !== n.containerInfo ||
            t.stateNode.implementation !== n.implementation
            ? ((t = bi(n, e.mode, r)), (t.return = e), t)
            : ((t = a(t, n.children || [])), (t.return = e), t);
        }
        function d(e, t, n, r, i) {
          return t === null || t.tag !== 7
            ? ((t = _i(n, e.mode, r, i)), (t.return = e), t)
            : ((t = a(t, n)), (t.return = e), t);
        }
        function f(e, t, n) {
          if (
            (typeof t == `string` && t !== ``) ||
            typeof t == `number` ||
            typeof t == `bigint`
          )
            return (t = vi(`` + t, e.mode, n)), (t.return = e), t;
          if (typeof t == `object` && t) {
            switch (t.$$typeof) {
              case _:
                return (
                  (n = gi(t.type, t.key, t.props, null, e.mode, n)),
                  Ra(n, t),
                  (n.return = e),
                  n
                );
              case v:
                return (t = bi(t, e.mode, n)), (t.return = e), t;
              case ae:
                return (t = ja(t)), f(e, t, n);
            }
            if (ue(t) || C(t))
              return (t = _i(t, e.mode, n, null)), (t.return = e), t;
            if (typeof t.then == `function`) return f(e, La(t), n);
            if (t.$$typeof === te) return f(e, aa(e, t), n);
            za(e, t);
          }
          return null;
        }
        function p(e, t, n, r) {
          var i = t === null ? null : t.key;
          if (
            (typeof n == `string` && n !== ``) ||
            typeof n == `number` ||
            typeof n == `bigint`
          )
            return i === null ? c(e, t, `` + n, r) : null;
          if (typeof n == `object` && n) {
            switch (n.$$typeof) {
              case _:
                return n.key === i ? l(e, t, n, r) : null;
              case v:
                return n.key === i ? u(e, t, n, r) : null;
              case ae:
                return (n = ja(n)), p(e, t, n, r);
            }
            if (ue(n) || C(n)) return i === null ? d(e, t, n, r, null) : null;
            if (typeof n.then == `function`) return p(e, t, La(n), r);
            if (n.$$typeof === te) return p(e, t, aa(e, n), r);
            za(e, n);
          }
          return null;
        }
        function m(e, t, n, r, i) {
          if (
            (typeof r == `string` && r !== ``) ||
            typeof r == `number` ||
            typeof r == `bigint`
          )
            return (e = e.get(n) || null), c(t, e, `` + r, i);
          if (typeof r == `object` && r) {
            switch (r.$$typeof) {
              case _:
                return (
                  (e = e.get(r.key === null ? n : r.key) || null), l(t, e, r, i)
                );
              case v:
                return (
                  (e = e.get(r.key === null ? n : r.key) || null), u(t, e, r, i)
                );
              case ae:
                return (r = ja(r)), m(e, t, n, r, i);
            }
            if (ue(r) || C(r))
              return (e = e.get(n) || null), d(t, e, r, i, null);
            if (typeof r.then == `function`) return m(e, t, n, La(r), i);
            if (r.$$typeof === te) return m(e, t, n, aa(t, r), i);
            za(t, r);
          }
          return null;
        }
        function h(i, a, s, c) {
          for (
            var l = null, u = null, d = a, h = (a = 0), g = null;
            d !== null && h < s.length;
            h++
          ) {
            d.index > h ? ((g = d), (d = null)) : (g = d.sibling);
            var _ = p(i, d, s[h], c);
            if (_ === null) {
              d === null && (d = g);
              break;
            }
            e && d && _.alternate === null && t(i, d),
              (a = o(_, a, h)),
              u === null ? (l = _) : (u.sibling = _),
              (u = _),
              (d = g);
          }
          if (h === s.length) return n(i, d), I && Mi(i, h), l;
          if (d === null) {
            for (; h < s.length; h++)
              (d = f(i, s[h], c)),
                d !== null &&
                  ((a = o(d, a, h)),
                  u === null ? (l = d) : (u.sibling = d),
                  (u = d));
            return I && Mi(i, h), l;
          }
          for (d = r(d); h < s.length; h++)
            (g = m(d, i, h, s[h], c)),
              g !== null &&
                (e &&
                  g.alternate !== null &&
                  d.delete(g.key === null ? h : g.key),
                (a = o(g, a, h)),
                u === null ? (l = g) : (u.sibling = g),
                (u = g));
          return e && d.forEach((e) => t(i, e)), I && Mi(i, h), l;
        }
        function g(a, s, c, l) {
          if (c == null) throw Error(i(151));
          for (
            var u = null, d = null, h = s, g = (s = 0), _ = null, v = c.next();
            h !== null && !v.done;
            g++, v = c.next()
          ) {
            h.index > g ? ((_ = h), (h = null)) : (_ = h.sibling);
            var y = p(a, h, v.value, l);
            if (y === null) {
              h === null && (h = _);
              break;
            }
            e && h && y.alternate === null && t(a, h),
              (s = o(y, s, g)),
              d === null ? (u = y) : (d.sibling = y),
              (d = y),
              (h = _);
          }
          if (v.done) return n(a, h), I && Mi(a, g), u;
          if (h === null) {
            for (; !v.done; g++, v = c.next())
              (v = f(a, v.value, l)),
                v !== null &&
                  ((s = o(v, s, g)),
                  d === null ? (u = v) : (d.sibling = v),
                  (d = v));
            return I && Mi(a, g), u;
          }
          for (h = r(h); !v.done; g++, v = c.next())
            (v = m(h, a, g, v.value, l)),
              v !== null &&
                (e &&
                  v.alternate !== null &&
                  h.delete(v.key === null ? g : v.key),
                (s = o(v, s, g)),
                d === null ? (u = v) : (d.sibling = v),
                (d = v));
          return e && h.forEach((e) => t(a, e)), I && Mi(a, g), u;
        }
        function b(e, r, o, c) {
          if (
            (typeof o == `object` &&
              o &&
              o.type === y &&
              o.key === null &&
              (o = o.props.children),
            typeof o == `object` && o)
          ) {
            switch (o.$$typeof) {
              case _:
                a: {
                  for (var l = o.key; r !== null; ) {
                    if (r.key === l) {
                      if (((l = o.type), l === y)) {
                        if (r.tag === 7) {
                          n(e, r.sibling),
                            (c = a(r, o.props.children)),
                            (c.return = e),
                            (e = c);
                          break a;
                        }
                      } else if (
                        r.elementType === l ||
                        (typeof l == `object` &&
                          l &&
                          l.$$typeof === ae &&
                          ja(l) === r.type)
                      ) {
                        n(e, r.sibling),
                          (c = a(r, o.props)),
                          Ra(c, o),
                          (c.return = e),
                          (e = c);
                        break a;
                      }
                      n(e, r);
                      break;
                    } else t(e, r);
                    r = r.sibling;
                  }
                  o.type === y
                    ? ((c = _i(o.props.children, e.mode, c, o.key)),
                      (c.return = e),
                      (e = c))
                    : ((c = gi(o.type, o.key, o.props, null, e.mode, c)),
                      Ra(c, o),
                      (c.return = e),
                      (e = c));
                }
                return s(e);
              case v:
                a: {
                  for (l = o.key; r !== null; ) {
                    if (r.key === l)
                      if (
                        r.tag === 4 &&
                        r.stateNode.containerInfo === o.containerInfo &&
                        r.stateNode.implementation === o.implementation
                      ) {
                        n(e, r.sibling),
                          (c = a(r, o.children || [])),
                          (c.return = e),
                          (e = c);
                        break a;
                      } else {
                        n(e, r);
                        break;
                      }
                    else t(e, r);
                    r = r.sibling;
                  }
                  (c = bi(o, e.mode, c)), (c.return = e), (e = c);
                }
                return s(e);
              case ae:
                return (o = ja(o)), b(e, r, o, c);
            }
            if (ue(o)) return h(e, r, o, c);
            if (C(o)) {
              if (((l = C(o)), typeof l != `function`)) throw Error(i(150));
              return (o = l.call(o)), g(e, r, o, c);
            }
            if (typeof o.then == `function`) return b(e, r, La(o), c);
            if (o.$$typeof === te) return b(e, r, aa(e, o), c);
            za(e, o);
          }
          return (typeof o == `string` && o !== ``) ||
            typeof o == `number` ||
            typeof o == `bigint`
            ? ((o = `` + o),
              r !== null && r.tag === 6
                ? (n(e, r.sibling), (c = a(r, o)), (c.return = e), (e = c))
                : (n(e, r), (c = vi(o, e.mode, c)), (c.return = e), (e = c)),
              s(e))
            : n(e, r);
        }
        return (e, t, n, r) => {
          try {
            Ia = 0;
            var i = b(e, t, n, r);
            return (Fa = null), i;
          } catch (t) {
            if (t === Ta || t === Da) throw t;
            var a = fi(29, t, null, e.mode);
            return (a.lanes = r), (a.return = e), a;
          }
        };
      }
      var Va = Ba(!0),
        Ha = Ba(!1),
        Ua = !1;
      function Wa(e) {
        e.updateQueue = {
          baseState: e.memoizedState,
          firstBaseUpdate: null,
          lastBaseUpdate: null,
          shared: { pending: null, lanes: 0, hiddenCallbacks: null },
          callbacks: null,
        };
      }
      function Ga(e, t) {
        (e = e.updateQueue),
          t.updateQueue === e &&
            (t.updateQueue = {
              baseState: e.baseState,
              firstBaseUpdate: e.firstBaseUpdate,
              lastBaseUpdate: e.lastBaseUpdate,
              shared: e.shared,
              callbacks: null,
            });
      }
      function Ka(e) {
        return { lane: e, tag: 0, payload: null, callback: null, next: null };
      }
      function qa(e, t, n) {
        var r = e.updateQueue;
        if (r === null) return null;
        if (((r = r.shared), K & 2)) {
          var i = r.pending;
          return (
            i === null ? (t.next = t) : ((t.next = i.next), (i.next = t)),
            (r.pending = t),
            (t = li(e)),
            ci(e, null, n),
            t
          );
        }
        return ai(e, r, t, n), li(e);
      }
      function Ja(e, t, n) {
        if (
          ((t = t.updateQueue), t !== null && ((t = t.shared), n & 4194048))
        ) {
          var r = t.lanes;
          (r &= e.pendingLanes), (n |= r), (t.lanes = n), ct(e, n);
        }
      }
      function Ya(e, t) {
        var n = e.updateQueue,
          r = e.alternate;
        if (r !== null && ((r = r.updateQueue), n === r)) {
          var i = null,
            a = null;
          if (((n = n.firstBaseUpdate), n !== null)) {
            do {
              var o = {
                lane: n.lane,
                tag: n.tag,
                payload: n.payload,
                callback: null,
                next: null,
              };
              a === null ? (i = a = o) : (a = a.next = o), (n = n.next);
            } while (n !== null);
            a === null ? (i = a = t) : (a = a.next = t);
          } else i = a = t;
          (n = {
            baseState: r.baseState,
            firstBaseUpdate: i,
            lastBaseUpdate: a,
            shared: r.shared,
            callbacks: r.callbacks,
          }),
            (e.updateQueue = n);
          return;
        }
        (e = n.lastBaseUpdate),
          e === null ? (n.firstBaseUpdate = t) : (e.next = t),
          (n.lastBaseUpdate = t);
      }
      var Xa = !1;
      function Za() {
        if (Xa) {
          var e = ga;
          if (e !== null) throw e;
        }
      }
      function Qa(e, t, n, r) {
        Xa = !1;
        var i = e.updateQueue;
        Ua = !1;
        var a = i.firstBaseUpdate,
          o = i.lastBaseUpdate,
          s = i.shared.pending;
        if (s !== null) {
          i.shared.pending = null;
          var c = s,
            l = c.next;
          (c.next = null), o === null ? (a = l) : (o.next = l), (o = c);
          var u = e.alternate;
          u !== null &&
            ((u = u.updateQueue),
            (s = u.lastBaseUpdate),
            s !== o &&
              (s === null ? (u.firstBaseUpdate = l) : (s.next = l),
              (u.lastBaseUpdate = c)));
        }
        if (a !== null) {
          var d = i.baseState;
          (o = 0), (u = l = c = null), (s = a);
          do {
            var f = s.lane & -536870913,
              p = f !== s.lane;
            if (p ? (Y & f) === f : (r & f) === f) {
              f !== 0 && f === ha && (Xa = !0),
                u !== null &&
                  (u = u.next =
                    {
                      lane: 0,
                      tag: s.tag,
                      payload: s.payload,
                      callback: null,
                      next: null,
                    });
              a: {
                var m = e,
                  g = s;
                f = t;
                var _ = n;
                switch (g.tag) {
                  case 1:
                    if (((m = g.payload), typeof m == `function`)) {
                      d = m.call(_, d, f);
                      break a;
                    }
                    d = m;
                    break a;
                  case 3:
                    m.flags = (m.flags & -65537) | 128;
                  case 0:
                    if (
                      ((m = g.payload),
                      (f = typeof m == `function` ? m.call(_, d, f) : m),
                      f == null)
                    )
                      break a;
                    d = h({}, d, f);
                    break a;
                  case 2:
                    Ua = !0;
                }
              }
              (f = s.callback),
                f !== null &&
                  ((e.flags |= 64),
                  p && (e.flags |= 8192),
                  (p = i.callbacks),
                  p === null ? (i.callbacks = [f]) : p.push(f));
            } else
              (p = {
                lane: f,
                tag: s.tag,
                payload: s.payload,
                callback: s.callback,
                next: null,
              }),
                u === null ? ((l = u = p), (c = d)) : (u = u.next = p),
                (o |= f);
            if (((s = s.next), s === null)) {
              if (((s = i.shared.pending), s === null)) break;
              (p = s),
                (s = p.next),
                (p.next = null),
                (i.lastBaseUpdate = p),
                (i.shared.pending = null);
            }
          } while (1);
          u === null && (c = d),
            (i.baseState = c),
            (i.firstBaseUpdate = l),
            (i.lastBaseUpdate = u),
            a === null && (i.shared.lanes = 0),
            (Gl |= o),
            (e.lanes = o),
            (e.memoizedState = d);
        }
      }
      function $a(e, t) {
        if (typeof e != `function`) throw Error(i(191, e));
        e.call(t);
      }
      function eo(e, t) {
        var n = e.callbacks;
        if (n !== null)
          for (e.callbacks = null, e = 0; e < n.length; e++) $a(n[e], t);
      }
      var to = me(null),
        no = me(0);
      function ro(e, t) {
        (e = Ul), D(no, e), D(to, t), (Ul = e | t.baseLanes);
      }
      function io() {
        D(no, Ul), D(to, to.current);
      }
      function ao() {
        (Ul = no.current), he(to), he(no);
      }
      var oo = me(null),
        so = null;
      function co(e) {
        var t = e.alternate;
        D(mo, mo.current & 1),
          D(oo, e),
          so === null &&
            (t === null || to.current !== null || t.memoizedState !== null) &&
            (so = e);
      }
      function lo(e) {
        D(mo, mo.current), D(oo, e), so === null && (so = e);
      }
      function uo(e) {
        e.tag === 22
          ? (D(mo, mo.current), D(oo, e), so === null && (so = e))
          : fo(e);
      }
      function fo() {
        D(mo, mo.current), D(oo, oo.current);
      }
      function po(e) {
        he(oo), so === e && (so = null), he(mo);
      }
      var mo = me(0);
      function ho(e) {
        for (var t = e; t !== null; ) {
          if (t.tag === 13) {
            var n = t.memoizedState;
            if (
              n !== null &&
              ((n = n.dehydrated), n === null || af(n) || of(n))
            )
              return t;
          } else if (
            t.tag === 19 &&
            (t.memoizedProps.revealOrder === `forwards` ||
              t.memoizedProps.revealOrder === `backwards` ||
              t.memoizedProps.revealOrder === `unstable_legacy-backwards` ||
              t.memoizedProps.revealOrder === `together`)
          ) {
            if (t.flags & 128) return t;
          } else if (t.child !== null) {
            (t.child.return = t), (t = t.child);
            continue;
          }
          if (t === e) break;
          for (; t.sibling === null; ) {
            if (t.return === null || t.return === e) return null;
            t = t.return;
          }
          (t.sibling.return = t.return), (t = t.sibling);
        }
        return null;
      }
      var go = 0,
        L = null,
        R = null,
        _o = null,
        vo = !1,
        yo = !1,
        bo = !1,
        xo = 0,
        So = 0,
        Co = null,
        wo = 0;
      function To() {
        throw Error(i(321));
      }
      function Eo(e, t) {
        if (t === null) return !1;
        for (var n = 0; n < t.length && n < e.length; n++)
          if (!Or(e[n], t[n])) return !1;
        return !0;
      }
      function Do(e, t, n, r, i, a) {
        return (
          (go = a),
          (L = t),
          (t.memoizedState = null),
          (t.updateQueue = null),
          (t.lanes = 0),
          (T.H = e === null || e.memoizedState === null ? Hs : Us),
          (bo = !1),
          (a = n(r, i)),
          (bo = !1),
          yo && (a = ko(t, n, r, i)),
          Oo(e),
          a
        );
      }
      function Oo(e) {
        T.H = Vs;
        var t = R !== null && R.next !== null;
        if (
          ((go = 0), (_o = R = L = null), (vo = !1), (So = 0), (Co = null), t)
        )
          throw Error(i(300));
        e === null ||
          oc ||
          ((e = e.dependencies), e !== null && na(e) && (oc = !0));
      }
      function ko(e, t, n, r) {
        L = e;
        var a = 0;
        do {
          if ((yo && (Co = null), (So = 0), (yo = !1), 25 <= a))
            throw Error(i(301));
          if (((a += 1), (_o = R = null), e.updateQueue != null)) {
            var o = e.updateQueue;
            (o.lastEffect = null),
              (o.events = null),
              (o.stores = null),
              o.memoCache != null && (o.memoCache.index = 0);
          }
          (T.H = Ws), (o = t(n, r));
        } while (yo);
        return o;
      }
      function Ao() {
        var e = T.H,
          t = e.useState()[0];
        return (
          (t = typeof t.then == `function` ? Lo(t) : t),
          (e = e.useState()[0]),
          (R === null ? null : R.memoizedState) !== e && (L.flags |= 1024),
          t
        );
      }
      function jo() {
        var e = xo !== 0;
        return (xo = 0), e;
      }
      function Mo(e, t, n) {
        (t.updateQueue = e.updateQueue), (t.flags &= -2053), (e.lanes &= ~n);
      }
      function No(e) {
        if (vo) {
          for (e = e.memoizedState; e !== null; ) {
            var t = e.queue;
            t !== null && (t.pending = null), (e = e.next);
          }
          vo = !1;
        }
        (go = 0), (_o = R = L = null), (yo = !1), (So = xo = 0), (Co = null);
      }
      function Po() {
        var e = {
          memoizedState: null,
          baseState: null,
          baseQueue: null,
          queue: null,
          next: null,
        };
        return (
          _o === null ? (L.memoizedState = _o = e) : (_o = _o.next = e), _o
        );
      }
      function Fo() {
        if (R === null) {
          var e = L.alternate;
          e = e === null ? null : e.memoizedState;
        } else e = R.next;
        var t = _o === null ? L.memoizedState : _o.next;
        if (t !== null) (_o = t), (R = e);
        else {
          if (e === null)
            throw L.alternate === null ? Error(i(467)) : Error(i(310));
          (R = e),
            (e = {
              memoizedState: R.memoizedState,
              baseState: R.baseState,
              baseQueue: R.baseQueue,
              queue: R.queue,
              next: null,
            }),
            _o === null ? (L.memoizedState = _o = e) : (_o = _o.next = e);
        }
        return _o;
      }
      function Io() {
        return {
          lastEffect: null,
          events: null,
          stores: null,
          memoCache: null,
        };
      }
      function Lo(e) {
        var t = So;
        return (
          (So += 1),
          Co === null && (Co = []),
          (e = Aa(Co, e, t)),
          (t = L),
          (_o === null ? t.memoizedState : _o.next) === null &&
            ((t = t.alternate),
            (T.H = t === null || t.memoizedState === null ? Hs : Us)),
          e
        );
      }
      function Ro(e) {
        if (typeof e == `object` && e) {
          if (typeof e.then == `function`) return Lo(e);
          if (e.$$typeof === te) return ia(e);
        }
        throw Error(i(438, String(e)));
      }
      function zo(e) {
        var t = null,
          n = L.updateQueue;
        if ((n !== null && (t = n.memoCache), t == null)) {
          var r = L.alternate;
          r !== null &&
            ((r = r.updateQueue),
            r !== null &&
              ((r = r.memoCache),
              r != null &&
                (t = { data: r.data.map((e) => e.slice()), index: 0 })));
        }
        if (
          ((t ??= { data: [], index: 0 }),
          n === null && ((n = Io()), (L.updateQueue = n)),
          (n.memoCache = t),
          (n = t.data[t.index]),
          n === void 0)
        )
          for (n = t.data[t.index] = Array(e), r = 0; r < e; r++) n[r] = se;
        return t.index++, n;
      }
      function Bo(e, t) {
        return typeof t == `function` ? t(e) : t;
      }
      function Vo(e) {
        return Ho(Fo(), R, e);
      }
      function Ho(e, t, n) {
        var r = e.queue;
        if (r === null) throw Error(i(311));
        r.lastRenderedReducer = n;
        var a = e.baseQueue,
          o = r.pending;
        if (o !== null) {
          if (a !== null) {
            var s = a.next;
            (a.next = o.next), (o.next = s);
          }
          (t.baseQueue = a = o), (r.pending = null);
        }
        if (((o = e.baseState), a === null)) e.memoizedState = o;
        else {
          t = a.next;
          var c = (s = null),
            l = null,
            u = t,
            d = !1;
          do {
            var f = u.lane & -536870913;
            if (f === u.lane ? (go & f) === f : (Y & f) === f) {
              var p = u.revertLane;
              if (p === 0)
                l !== null &&
                  (l = l.next =
                    {
                      lane: 0,
                      revertLane: 0,
                      gesture: null,
                      action: u.action,
                      hasEagerState: u.hasEagerState,
                      eagerState: u.eagerState,
                      next: null,
                    }),
                  f === ha && (d = !0);
              else if ((go & p) === p) {
                (u = u.next), p === ha && (d = !0);
                continue;
              } else
                (f = {
                  lane: 0,
                  revertLane: u.revertLane,
                  gesture: null,
                  action: u.action,
                  hasEagerState: u.hasEagerState,
                  eagerState: u.eagerState,
                  next: null,
                }),
                  l === null ? ((c = l = f), (s = o)) : (l = l.next = f),
                  (L.lanes |= p),
                  (Gl |= p);
              (f = u.action),
                bo && n(o, f),
                (o = u.hasEagerState ? u.eagerState : n(o, f));
            } else
              (p = {
                lane: f,
                revertLane: u.revertLane,
                gesture: u.gesture,
                action: u.action,
                hasEagerState: u.hasEagerState,
                eagerState: u.eagerState,
                next: null,
              }),
                l === null ? ((c = l = p), (s = o)) : (l = l.next = p),
                (L.lanes |= f),
                (Gl |= f);
            u = u.next;
          } while (u !== null && u !== t);
          if (
            (l === null ? (s = o) : (l.next = c),
            !Or(o, e.memoizedState) && ((oc = !0), d && ((n = ga), n !== null)))
          )
            throw n;
          (e.memoizedState = o),
            (e.baseState = s),
            (e.baseQueue = l),
            (r.lastRenderedState = o);
        }
        return a === null && (r.lanes = 0), [e.memoizedState, r.dispatch];
      }
      function Uo(e) {
        var t = Fo(),
          n = t.queue;
        if (n === null) throw Error(i(311));
        n.lastRenderedReducer = e;
        var r = n.dispatch,
          a = n.pending,
          o = t.memoizedState;
        if (a !== null) {
          n.pending = null;
          var s = (a = a.next);
          do (o = e(o, s.action)), (s = s.next);
          while (s !== a);
          Or(o, t.memoizedState) || (oc = !0),
            (t.memoizedState = o),
            t.baseQueue === null && (t.baseState = o),
            (n.lastRenderedState = o);
        }
        return [o, r];
      }
      function Wo(e, t, n) {
        var r = L,
          a = Fo(),
          o = I;
        if (o) {
          if (n === void 0) throw Error(i(407));
          n = n();
        } else n = t();
        var s = !Or((R || a).memoizedState, n);
        if (
          (s && ((a.memoizedState = n), (oc = !0)),
          (a = a.queue),
          hs(qo.bind(null, r, a, e), [e]),
          a.getSnapshot !== t || s || (_o !== null && _o.memoizedState.tag & 1))
        ) {
          if (
            ((r.flags |= 2048),
            us(9, { destroy: void 0 }, Ko.bind(null, r, a, n, t), null),
            q === null)
          )
            throw Error(i(349));
          o || go & 127 || Go(r, t, n);
        }
        return n;
      }
      function Go(e, t, n) {
        (e.flags |= 16384),
          (e = { getSnapshot: t, value: n }),
          (t = L.updateQueue),
          t === null
            ? ((t = Io()), (L.updateQueue = t), (t.stores = [e]))
            : ((n = t.stores), n === null ? (t.stores = [e]) : n.push(e));
      }
      function Ko(e, t, n, r) {
        (t.value = n), (t.getSnapshot = r), Jo(t) && Yo(e);
      }
      function qo(e, t, n) {
        return n(() => {
          Jo(t) && Yo(e);
        });
      }
      function Jo(e) {
        var t = e.getSnapshot;
        e = e.value;
        try {
          var n = t();
          return !Or(e, n);
        } catch {
          return !0;
        }
      }
      function Yo(e) {
        var t = si(e, 2);
        t !== null && hu(t, e, 2);
      }
      function Xo(e) {
        var t = Po();
        if (typeof e == `function`) {
          var n = e;
          if (((e = n()), bo)) {
            Ge(!0);
            try {
              n();
            } finally {
              Ge(!1);
            }
          }
        }
        return (
          (t.memoizedState = t.baseState = e),
          (t.queue = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Bo,
            lastRenderedState: e,
          }),
          t
        );
      }
      function Zo(e, t, n, r) {
        return (e.baseState = n), Ho(e, R, typeof r == `function` ? r : Bo);
      }
      function Qo(e, t, n, r, a) {
        if (zs(e)) throw Error(i(485));
        if (((e = t.action), e !== null)) {
          var o = {
            payload: a,
            action: e,
            next: null,
            isTransition: !0,
            status: `pending`,
            value: null,
            reason: null,
            listeners: [],
            then: (e) => {
              o.listeners.push(e);
            },
          };
          T.T === null ? (o.isTransition = !1) : n(!0),
            r(o),
            (n = t.pending),
            n === null
              ? ((o.next = t.pending = o), $o(t, o))
              : ((o.next = n.next), (t.pending = n.next = o));
        }
      }
      function $o(e, t) {
        var n = t.action,
          r = t.payload,
          i = e.state;
        if (t.isTransition) {
          var a = T.T,
            o = {};
          T.T = o;
          try {
            var s = n(i, r),
              c = T.S;
            c !== null && c(o, s), es(e, t, s);
          } catch (n) {
            ns(e, t, n);
          } finally {
            a !== null && o.types !== null && (a.types = o.types), (T.T = a);
          }
        } else
          try {
            (a = n(i, r)), es(e, t, a);
          } catch (n) {
            ns(e, t, n);
          }
      }
      function es(e, t, n) {
        typeof n == `object` && n && typeof n.then == `function`
          ? n.then(
              (n) => {
                ts(e, t, n);
              },
              (n) => ns(e, t, n),
            )
          : ts(e, t, n);
      }
      function ts(e, t, n) {
        (t.status = `fulfilled`),
          (t.value = n),
          rs(t),
          (e.state = n),
          (t = e.pending),
          t !== null &&
            ((n = t.next),
            n === t
              ? (e.pending = null)
              : ((n = n.next), (t.next = n), $o(e, n)));
      }
      function ns(e, t, n) {
        var r = e.pending;
        if (((e.pending = null), r !== null)) {
          r = r.next;
          do (t.status = `rejected`), (t.reason = n), rs(t), (t = t.next);
          while (t !== r);
        }
        e.action = null;
      }
      function rs(e) {
        e = e.listeners;
        for (var t = 0; t < e.length; t++) (0, e[t])();
      }
      function is(e, t) {
        return t;
      }
      function as(e, t) {
        if (I) {
          var n = q.formState;
          if (n !== null) {
            a: {
              var r = L;
              if (I) {
                if (F) {
                  b: {
                    for (var i = F, a = zi; i.nodeType !== 8; ) {
                      if (!a) {
                        i = null;
                        break b;
                      }
                      if (((i = cf(i.nextSibling)), i === null)) {
                        i = null;
                        break b;
                      }
                    }
                    (a = i.data), (i = a === `F!` || a === `F` ? i : null);
                  }
                  if (i) {
                    (F = cf(i.nextSibling)), (r = i.data === `F!`);
                    break a;
                  }
                }
                Vi(r);
              }
              r = !1;
            }
            r && (t = n[0]);
          }
        }
        return (
          (n = Po()),
          (n.memoizedState = n.baseState = t),
          (r = {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: is,
            lastRenderedState: t,
          }),
          (n.queue = r),
          (n = Is.bind(null, L, r)),
          (r.dispatch = n),
          (r = Xo(!1)),
          (a = Rs.bind(null, L, !1, r.queue)),
          (r = Po()),
          (i = { state: t, dispatch: null, action: e, pending: null }),
          (r.queue = i),
          (n = Qo.bind(null, L, i, a, n)),
          (i.dispatch = n),
          (r.memoizedState = e),
          [t, n, !1]
        );
      }
      function os(e) {
        return ss(Fo(), R, e);
      }
      function ss(e, t, n) {
        if (
          ((t = Ho(e, t, is)[0]),
          (e = Vo(Bo)[0]),
          typeof t == `object` && t && typeof t.then == `function`)
        )
          try {
            var r = Lo(t);
          } catch (e) {
            throw e === Ta ? Da : e;
          }
        else r = t;
        t = Fo();
        var i = t.queue,
          a = i.dispatch;
        return (
          n !== t.memoizedState &&
            ((L.flags |= 2048),
            us(9, { destroy: void 0 }, cs.bind(null, i, n), null)),
          [r, a, e]
        );
      }
      function cs(e, t) {
        e.action = t;
      }
      function ls(e) {
        var t = Fo(),
          n = R;
        if (n !== null) return ss(t, n, e);
        Fo(), (t = t.memoizedState), (n = Fo());
        var r = n.queue.dispatch;
        return (n.memoizedState = e), [t, r, !1];
      }
      function us(e, t, n, r) {
        return (
          (e = { tag: e, create: n, deps: r, inst: t, next: null }),
          (t = L.updateQueue),
          t === null && ((t = Io()), (L.updateQueue = t)),
          (n = t.lastEffect),
          n === null
            ? (t.lastEffect = e.next = e)
            : ((r = n.next), (n.next = e), (e.next = r), (t.lastEffect = e)),
          e
        );
      }
      function ds() {
        return Fo().memoizedState;
      }
      function fs(e, t, n, r) {
        var i = Po();
        (L.flags |= e),
          (i.memoizedState = us(
            1 | t,
            { destroy: void 0 },
            n,
            r === void 0 ? null : r,
          ));
      }
      function ps(e, t, n, r) {
        var i = Fo();
        r = r === void 0 ? null : r;
        var a = i.memoizedState.inst;
        R !== null && r !== null && Eo(r, R.memoizedState.deps)
          ? (i.memoizedState = us(t, a, n, r))
          : ((L.flags |= e), (i.memoizedState = us(1 | t, a, n, r)));
      }
      function ms(e, t) {
        fs(8390656, 8, e, t);
      }
      function hs(e, t) {
        ps(2048, 8, e, t);
      }
      function gs(e) {
        L.flags |= 4;
        var t = L.updateQueue;
        if (t === null) (t = Io()), (L.updateQueue = t), (t.events = [e]);
        else {
          var n = t.events;
          n === null ? (t.events = [e]) : n.push(e);
        }
      }
      function _s(e) {
        var t = Fo().memoizedState;
        return (
          gs({ ref: t, nextImpl: e }),
          function () {
            if (K & 2) throw Error(i(440));
            return t.impl.apply(void 0, arguments);
          }
        );
      }
      function vs(e, t) {
        return ps(4, 2, e, t);
      }
      function z(e, t) {
        return ps(4, 4, e, t);
      }
      function ys(e, t) {
        if (typeof t == `function`) {
          e = e();
          var n = t(e);
          return () => {
            typeof n == `function` ? n() : t(null);
          };
        }
        if (t != null)
          return (
            (e = e()),
            (t.current = e),
            () => {
              t.current = null;
            }
          );
      }
      function bs(e, t, n) {
        (n = n == null ? null : n.concat([e])),
          ps(4, 4, ys.bind(null, t, e), n);
      }
      function xs() {}
      function Ss(e, t) {
        var n = Fo();
        t = t === void 0 ? null : t;
        var r = n.memoizedState;
        return t !== null && Eo(t, r[1])
          ? r[0]
          : ((n.memoizedState = [e, t]), e);
      }
      function Cs(e, t) {
        var n = Fo();
        t = t === void 0 ? null : t;
        var r = n.memoizedState;
        if (t !== null && Eo(t, r[1])) return r[0];
        if (((r = e()), bo)) {
          Ge(!0);
          try {
            e();
          } finally {
            Ge(!1);
          }
        }
        return (n.memoizedState = [r, t]), r;
      }
      function ws(e, t, n) {
        return n === void 0 || (go & 1073741824 && !(Y & 261930))
          ? (e.memoizedState = t)
          : ((e.memoizedState = n), (e = mu()), (L.lanes |= e), (Gl |= e), n);
      }
      function Ts(e, t, n, r) {
        return Or(n, t)
          ? n
          : to.current === null
            ? !(go & 42) || (go & 1073741824 && !(Y & 261930))
              ? ((oc = !0), (e.memoizedState = n))
              : ((e = mu()), (L.lanes |= e), (Gl |= e), t)
            : ((e = ws(e, n, r)), Or(e, t) || (oc = !0), e);
      }
      function Es(e, t, n, r, i) {
        var a = E.p;
        E.p = a !== 0 && 8 > a ? a : 8;
        var o = T.T,
          s = {};
        (T.T = s), Rs(e, !1, t, n);
        try {
          var c = i(),
            l = T.S;
          l !== null && l(s, c),
            typeof c == `object` && c && typeof c.then == `function`
              ? Ls(e, t, ya(c, r), pu(e))
              : Ls(e, t, r, pu(e));
        } catch (n) {
          Ls(e, t, { then: () => {}, status: `rejected`, reason: n }, pu());
        } finally {
          (E.p = a),
            o !== null && s.types !== null && (o.types = s.types),
            (T.T = o);
        }
      }
      function Ds() {}
      function Os(e, t, n, r) {
        if (e.tag !== 5) throw Error(i(476));
        var a = ks(e).queue;
        Es(e, a, t, de, n === null ? Ds : () => (As(e), n(r)));
      }
      function ks(e) {
        var t = e.memoizedState;
        if (t !== null) return t;
        t = {
          memoizedState: de,
          baseState: de,
          baseQueue: null,
          queue: {
            pending: null,
            lanes: 0,
            dispatch: null,
            lastRenderedReducer: Bo,
            lastRenderedState: de,
          },
          next: null,
        };
        var n = {};
        return (
          (t.next = {
            memoizedState: n,
            baseState: n,
            baseQueue: null,
            queue: {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: Bo,
              lastRenderedState: n,
            },
            next: null,
          }),
          (e.memoizedState = t),
          (e = e.alternate),
          e !== null && (e.memoizedState = t),
          t
        );
      }
      function As(e) {
        var t = ks(e);
        t.next === null && (t = e.alternate.memoizedState),
          Ls(e, t.next.queue, {}, pu());
      }
      function js() {
        return ia(Qf);
      }
      function Ms() {
        return Fo().memoizedState;
      }
      function Ns() {
        return Fo().memoizedState;
      }
      function Ps(e) {
        for (var t = e.return; t !== null; ) {
          switch (t.tag) {
            case 24:
            case 3: {
              var n = pu();
              e = Ka(n);
              var r = qa(t, e, n);
              r !== null && (hu(r, t, n), Ja(r, t, n)),
                (t = { cache: da() }),
                (e.payload = t);
              return;
            }
          }
          t = t.return;
        }
      }
      function Fs(e, t, n) {
        var r = pu();
        (n = {
          lane: r,
          revertLane: 0,
          gesture: null,
          action: n,
          hasEagerState: !1,
          eagerState: null,
          next: null,
        }),
          zs(e)
            ? B(t, n)
            : ((n = oi(e, t, n, r)), n !== null && (hu(n, e, r), Bs(n, t, r)));
      }
      function Is(e, t, n) {
        Ls(e, t, n, pu());
      }
      function Ls(e, t, n, r) {
        var i = {
          lane: r,
          revertLane: 0,
          gesture: null,
          action: n,
          hasEagerState: !1,
          eagerState: null,
          next: null,
        };
        if (zs(e)) B(t, i);
        else {
          var a = e.alternate;
          if (
            e.lanes === 0 &&
            (a === null || a.lanes === 0) &&
            ((a = t.lastRenderedReducer), a !== null)
          )
            try {
              var o = t.lastRenderedState,
                s = a(o, n);
              if (((i.hasEagerState = !0), (i.eagerState = s), Or(s, o)))
                return ai(e, t, i, 0), q === null && ii(), !1;
            } catch {}
          if (((n = oi(e, t, i, r)), n !== null))
            return hu(n, e, r), Bs(n, t, r), !0;
        }
        return !1;
      }
      function Rs(e, t, n, r) {
        if (
          ((r = {
            lane: 2,
            revertLane: dd(),
            gesture: null,
            action: r,
            hasEagerState: !1,
            eagerState: null,
            next: null,
          }),
          zs(e))
        ) {
          if (t) throw Error(i(479));
        } else (t = oi(e, n, r, 2)), t !== null && hu(t, e, 2);
      }
      function zs(e) {
        var t = e.alternate;
        return e === L || (t !== null && t === L);
      }
      function B(e, t) {
        yo = vo = !0;
        var n = e.pending;
        n === null ? (t.next = t) : ((t.next = n.next), (n.next = t)),
          (e.pending = t);
      }
      function Bs(e, t, n) {
        if (n & 4194048) {
          var r = t.lanes;
          (r &= e.pendingLanes), (n |= r), (t.lanes = n), ct(e, n);
        }
      }
      var Vs = {
        readContext: ia,
        use: Ro,
        useCallback: To,
        useContext: To,
        useEffect: To,
        useImperativeHandle: To,
        useLayoutEffect: To,
        useInsertionEffect: To,
        useMemo: To,
        useReducer: To,
        useRef: To,
        useState: To,
        useDebugValue: To,
        useDeferredValue: To,
        useTransition: To,
        useSyncExternalStore: To,
        useId: To,
        useHostTransitionStatus: To,
        useFormState: To,
        useActionState: To,
        useOptimistic: To,
        useMemoCache: To,
        useCacheRefresh: To,
      };
      Vs.useEffectEvent = To;
      var Hs = {
          readContext: ia,
          use: Ro,
          useCallback: (e, t) => (
            (Po().memoizedState = [e, t === void 0 ? null : t]), e
          ),
          useContext: ia,
          useEffect: ms,
          useImperativeHandle: (e, t, n) => {
            (n = n == null ? null : n.concat([e])),
              fs(4194308, 4, ys.bind(null, t, e), n);
          },
          useLayoutEffect: (e, t) => fs(4194308, 4, e, t),
          useInsertionEffect: (e, t) => {
            fs(4, 2, e, t);
          },
          useMemo: (e, t) => {
            var n = Po();
            t = t === void 0 ? null : t;
            var r = e();
            if (bo) {
              Ge(!0);
              try {
                e();
              } finally {
                Ge(!1);
              }
            }
            return (n.memoizedState = [r, t]), r;
          },
          useReducer: (e, t, n) => {
            var r = Po();
            if (n !== void 0) {
              var i = n(t);
              if (bo) {
                Ge(!0);
                try {
                  n(t);
                } finally {
                  Ge(!1);
                }
              }
            } else i = t;
            return (
              (r.memoizedState = r.baseState = i),
              (e = {
                pending: null,
                lanes: 0,
                dispatch: null,
                lastRenderedReducer: e,
                lastRenderedState: i,
              }),
              (r.queue = e),
              (e = e.dispatch = Fs.bind(null, L, e)),
              [r.memoizedState, e]
            );
          },
          useRef: (e) => {
            var t = Po();
            return (e = { current: e }), (t.memoizedState = e);
          },
          useState: (e) => {
            e = Xo(e);
            var t = e.queue,
              n = Is.bind(null, L, t);
            return (t.dispatch = n), [e.memoizedState, n];
          },
          useDebugValue: xs,
          useDeferredValue: (e, t) => ws(Po(), e, t),
          useTransition: () => {
            var e = Xo(!1);
            return (
              (e = Es.bind(null, L, e.queue, !0, !1)),
              (Po().memoizedState = e),
              [!1, e]
            );
          },
          useSyncExternalStore: (e, t, n) => {
            var r = L,
              a = Po();
            if (I) {
              if (n === void 0) throw Error(i(407));
              n = n();
            } else {
              if (((n = t()), q === null)) throw Error(i(349));
              Y & 127 || Go(r, t, n);
            }
            a.memoizedState = n;
            var o = { value: n, getSnapshot: t };
            return (
              (a.queue = o),
              ms(qo.bind(null, r, o, e), [e]),
              (r.flags |= 2048),
              us(9, { destroy: void 0 }, Ko.bind(null, r, o, n, t), null),
              n
            );
          },
          useId: () => {
            var e = Po(),
              t = q.identifierPrefix;
            if (I) {
              var n = ji,
                r = Ai;
              (n = (r & ~(1 << (32 - Ke(r) - 1))).toString(32) + n),
                (t = `_` + t + `R_` + n),
                (n = xo++),
                0 < n && (t += `H` + n.toString(32)),
                (t += `_`);
            } else (n = wo++), (t = `_` + t + `r_` + n.toString(32) + `_`);
            return (e.memoizedState = t);
          },
          useHostTransitionStatus: js,
          useFormState: as,
          useActionState: as,
          useOptimistic: (e) => {
            var t = Po();
            t.memoizedState = t.baseState = e;
            var n = {
              pending: null,
              lanes: 0,
              dispatch: null,
              lastRenderedReducer: null,
              lastRenderedState: null,
            };
            return (
              (t.queue = n),
              (t = Rs.bind(null, L, !0, n)),
              (n.dispatch = t),
              [e, t]
            );
          },
          useMemoCache: zo,
          useCacheRefresh: () => (Po().memoizedState = Ps.bind(null, L)),
          useEffectEvent: (e) => {
            var t = Po(),
              n = { impl: e };
            return (
              (t.memoizedState = n),
              function () {
                if (K & 2) throw Error(i(440));
                return n.impl.apply(void 0, arguments);
              }
            );
          },
        },
        Us = {
          readContext: ia,
          use: Ro,
          useCallback: Ss,
          useContext: ia,
          useEffect: hs,
          useImperativeHandle: bs,
          useInsertionEffect: vs,
          useLayoutEffect: z,
          useMemo: Cs,
          useReducer: Vo,
          useRef: ds,
          useState: () => Vo(Bo),
          useDebugValue: xs,
          useDeferredValue: (e, t) => Ts(Fo(), R.memoizedState, e, t),
          useTransition: () => {
            var e = Vo(Bo)[0],
              t = Fo().memoizedState;
            return [typeof e == `boolean` ? e : Lo(e), t];
          },
          useSyncExternalStore: Wo,
          useId: Ms,
          useHostTransitionStatus: js,
          useFormState: os,
          useActionState: os,
          useOptimistic: (e, t) => Zo(Fo(), R, e, t),
          useMemoCache: zo,
          useCacheRefresh: Ns,
        };
      Us.useEffectEvent = _s;
      var Ws = {
        readContext: ia,
        use: Ro,
        useCallback: Ss,
        useContext: ia,
        useEffect: hs,
        useImperativeHandle: bs,
        useInsertionEffect: vs,
        useLayoutEffect: z,
        useMemo: Cs,
        useReducer: Uo,
        useRef: ds,
        useState: () => Uo(Bo),
        useDebugValue: xs,
        useDeferredValue: (e, t) => {
          var n = Fo();
          return R === null ? ws(n, e, t) : Ts(n, R.memoizedState, e, t);
        },
        useTransition: () => {
          var e = Uo(Bo)[0],
            t = Fo().memoizedState;
          return [typeof e == `boolean` ? e : Lo(e), t];
        },
        useSyncExternalStore: Wo,
        useId: Ms,
        useHostTransitionStatus: js,
        useFormState: ls,
        useActionState: ls,
        useOptimistic: (e, t) => {
          var n = Fo();
          return R === null
            ? ((n.baseState = e), [e, n.queue.dispatch])
            : Zo(n, R, e, t);
        },
        useMemoCache: zo,
        useCacheRefresh: Ns,
      };
      Ws.useEffectEvent = _s;
      function Gs(e, t, n, r) {
        (t = e.memoizedState),
          (n = n(r, t)),
          (n = n == null ? t : h({}, t, n)),
          (e.memoizedState = n),
          e.lanes === 0 && (e.updateQueue.baseState = n);
      }
      var Ks = {
        enqueueSetState: (e, t, n) => {
          e = e._reactInternals;
          var r = pu(),
            i = Ka(r);
          (i.payload = t),
            n != null && (i.callback = n),
            (t = qa(e, i, r)),
            t !== null && (hu(t, e, r), Ja(t, e, r));
        },
        enqueueReplaceState: (e, t, n) => {
          e = e._reactInternals;
          var r = pu(),
            i = Ka(r);
          (i.tag = 1),
            (i.payload = t),
            n != null && (i.callback = n),
            (t = qa(e, i, r)),
            t !== null && (hu(t, e, r), Ja(t, e, r));
        },
        enqueueForceUpdate: (e, t) => {
          e = e._reactInternals;
          var n = pu(),
            r = Ka(n);
          (r.tag = 2),
            t != null && (r.callback = t),
            (t = qa(e, r, n)),
            t !== null && (hu(t, e, n), Ja(t, e, n));
        },
      };
      function qs(e, t, n, r, i, a, o) {
        return (
          (e = e.stateNode),
          typeof e.shouldComponentUpdate == `function`
            ? e.shouldComponentUpdate(r, a, o)
            : t.prototype && t.prototype.isPureReactComponent
              ? !kr(n, r) || !kr(i, a)
              : !0
        );
      }
      function Js(e, t, n, r) {
        (e = t.state),
          typeof t.componentWillReceiveProps == `function` &&
            t.componentWillReceiveProps(n, r),
          typeof t.UNSAFE_componentWillReceiveProps == `function` &&
            t.UNSAFE_componentWillReceiveProps(n, r),
          t.state !== e && Ks.enqueueReplaceState(t, t.state, null);
      }
      function Ys(e, t) {
        var n = t;
        if (`ref` in t)
          for (var r in ((n = {}), t)) r !== `ref` && (n[r] = t[r]);
        if ((e = e.defaultProps))
          for (var i in (n === t && (n = h({}, n)), e))
            n[i] === void 0 && (n[i] = e[i]);
        return n;
      }
      function Xs(e) {
        ti(e);
      }
      function Zs(e) {
        console.error(e);
      }
      function Qs(e) {
        ti(e);
      }
      function $s(e, t) {
        try {
          var n = e.onUncaughtError;
          n(t.value, { componentStack: t.stack });
        } catch (e) {
          setTimeout(() => {
            throw e;
          });
        }
      }
      function ec(e, t, n) {
        try {
          var r = e.onCaughtError;
          r(n.value, {
            componentStack: n.stack,
            errorBoundary: t.tag === 1 ? t.stateNode : null,
          });
        } catch (e) {
          setTimeout(() => {
            throw e;
          });
        }
      }
      function tc(e, t, n) {
        return (
          (n = Ka(n)),
          (n.tag = 3),
          (n.payload = { element: null }),
          (n.callback = () => {
            $s(e, t);
          }),
          n
        );
      }
      function nc(e) {
        return (e = Ka(e)), (e.tag = 3), e;
      }
      function rc(e, t, n, r) {
        var i = n.type.getDerivedStateFromError;
        if (typeof i == `function`) {
          var a = r.value;
          (e.payload = () => i(a)),
            (e.callback = () => {
              ec(t, n, r);
            });
        }
        var o = n.stateNode;
        o !== null &&
          typeof o.componentDidCatch == `function` &&
          (e.callback = function () {
            ec(t, n, r),
              typeof i != `function` &&
                (ru === null ? (ru = new Set([this])) : ru.add(this));
            var e = r.stack;
            this.componentDidCatch(r.value, {
              componentStack: e === null ? `` : e,
            });
          });
      }
      function ic(e, t, n, r, a) {
        if (
          ((n.flags |= 32768),
          typeof r == `object` && r && typeof r.then == `function`)
        ) {
          if (
            ((t = n.alternate),
            t !== null && ta(t, n, a, !0),
            (n = oo.current),
            n !== null)
          ) {
            switch (n.tag) {
              case 31:
              case 13:
                return (
                  so === null
                    ? Du()
                    : n.alternate === null && Wl === 0 && (Wl = 3),
                  (n.flags &= -257),
                  (n.flags |= 65536),
                  (n.lanes = a),
                  r === Oa
                    ? (n.flags |= 16384)
                    : ((t = n.updateQueue),
                      t === null ? (n.updateQueue = new Set([r])) : t.add(r),
                      Gu(e, r, a)),
                  !1
                );
              case 22:
                return (
                  (n.flags |= 65536),
                  r === Oa
                    ? (n.flags |= 16384)
                    : ((t = n.updateQueue),
                      t === null
                        ? ((t = {
                            transitions: null,
                            markerInstances: null,
                            retryQueue: new Set([r]),
                          }),
                          (n.updateQueue = t))
                        : ((n = t.retryQueue),
                          n === null
                            ? (t.retryQueue = new Set([r]))
                            : n.add(r)),
                      Gu(e, r, a)),
                  !1
                );
            }
            throw Error(i(435, n.tag));
          }
          return Gu(e, r, a), Du(), !1;
        }
        if (I)
          return (
            (t = oo.current),
            t === null
              ? (r !== Bi && ((t = Error(i(423), { cause: r })), qi(Si(t, n))),
                (e = e.current.alternate),
                (e.flags |= 65536),
                (a &= -a),
                (e.lanes |= a),
                (r = Si(r, n)),
                (a = tc(e.stateNode, r, a)),
                Ya(e, a),
                Wl !== 4 && (Wl = 2))
              : (!(t.flags & 65536) && (t.flags |= 256),
                (t.flags |= 65536),
                (t.lanes = a),
                r !== Bi && ((e = Error(i(422), { cause: r })), qi(Si(e, n)))),
            !1
          );
        var o = Error(i(520), { cause: r });
        if (
          ((o = Si(o, n)),
          Xl === null ? (Xl = [o]) : Xl.push(o),
          Wl !== 4 && (Wl = 2),
          t === null)
        )
          return !0;
        (r = Si(r, n)), (n = t);
        do {
          switch (n.tag) {
            case 3:
              return (
                (n.flags |= 65536),
                (e = a & -a),
                (n.lanes |= e),
                (e = tc(n.stateNode, r, e)),
                Ya(n, e),
                !1
              );
            case 1:
              if (
                ((t = n.type),
                (o = n.stateNode),
                !(n.flags & 128) &&
                  (typeof t.getDerivedStateFromError == `function` ||
                    (o !== null &&
                      typeof o.componentDidCatch == `function` &&
                      (ru === null || !ru.has(o)))))
              )
                return (
                  (n.flags |= 65536),
                  (a &= -a),
                  (n.lanes |= a),
                  (a = nc(a)),
                  rc(a, e, n, r),
                  Ya(n, a),
                  !1
                );
          }
          n = n.return;
        } while (n !== null);
        return !1;
      }
      var ac = Error(i(461)),
        oc = !1;
      function sc(e, t, n, r) {
        t.child = e === null ? Ha(t, null, n, r) : Va(t, e.child, n, r);
      }
      function cc(e, t, n, r, i) {
        n = n.render;
        var a = t.ref;
        if (`ref` in r) {
          var o = {};
          for (var s in r) s !== `ref` && (o[s] = r[s]);
        } else o = r;
        return (
          ra(t),
          (r = Do(e, t, n, o, a, i)),
          (s = jo()),
          e !== null && !oc
            ? (Mo(e, t, i), jc(e, t, i))
            : (I && s && Pi(t), (t.flags |= 1), sc(e, t, r, i), t.child)
        );
      }
      function lc(e, t, n, r, i) {
        if (e === null) {
          var a = n.type;
          return typeof a == `function` &&
            !pi(a) &&
            a.defaultProps === void 0 &&
            n.compare === null
            ? ((t.tag = 15), (t.type = a), uc(e, t, a, r, i))
            : ((e = gi(n.type, null, r, t, t.mode, i)),
              (e.ref = t.ref),
              (e.return = t),
              (t.child = e));
        }
        if (((a = e.child), !Mc(e, i))) {
          var o = a.memoizedProps;
          if (
            ((n = n.compare),
            (n = n === null ? kr : n),
            n(o, r) && e.ref === t.ref)
          )
            return jc(e, t, i);
        }
        return (
          (t.flags |= 1),
          (e = mi(a, r)),
          (e.ref = t.ref),
          (e.return = t),
          (t.child = e)
        );
      }
      function uc(e, t, n, r, i) {
        if (e !== null) {
          var a = e.memoizedProps;
          if (kr(a, r) && e.ref === t.ref)
            if (((oc = !1), (t.pendingProps = r = a), Mc(e, i)))
              e.flags & 131072 && (oc = !0);
            else return (t.lanes = e.lanes), jc(e, t, i);
        }
        return _c(e, t, n, r, i);
      }
      function V(e, t, n, r) {
        var i = r.children,
          a = e === null ? null : e.memoizedState;
        if (
          (e === null &&
            t.stateNode === null &&
            (t.stateNode = {
              _visibility: 1,
              _pendingMarkers: null,
              _retryCache: null,
              _transitions: null,
            }),
          r.mode === `hidden`)
        ) {
          if (t.flags & 128) {
            if (((a = a === null ? n : a.baseLanes | n), e !== null)) {
              for (r = t.child = e.child, i = 0; r !== null; )
                (i = i | r.lanes | r.childLanes), (r = r.sibling);
              r = i & ~a;
            } else (r = 0), (t.child = null);
            return fc(e, t, a, n, r);
          }
          if (n & 536870912)
            (t.memoizedState = { baseLanes: 0, cachePool: null }),
              e !== null && Ca(t, a === null ? null : a.cachePool),
              a === null ? io() : ro(t, a),
              uo(t);
          else
            return (
              (r = t.lanes = 536870912),
              fc(e, t, a === null ? n : a.baseLanes | n, n, r)
            );
        } else
          a === null
            ? (e !== null && Ca(t, null), io(), fo(t))
            : (Ca(t, a.cachePool), ro(t, a), fo(t), (t.memoizedState = null));
        return sc(e, t, i, n), t.child;
      }
      function dc(e, t) {
        return (
          (e !== null && e.tag === 22) ||
            t.stateNode !== null ||
            (t.stateNode = {
              _visibility: 1,
              _pendingMarkers: null,
              _retryCache: null,
              _transitions: null,
            }),
          t.sibling
        );
      }
      function fc(e, t, n, r, i) {
        var a = Sa();
        return (
          (a = a === null ? null : { parent: ua._currentValue, pool: a }),
          (t.memoizedState = { baseLanes: n, cachePool: a }),
          e !== null && Ca(t, null),
          io(),
          uo(t),
          e !== null && ta(e, t, r, !0),
          (t.childLanes = i),
          null
        );
      }
      function pc(e, t) {
        return (
          (t = Ec({ mode: t.mode, children: t.children }, e.mode)),
          (t.ref = e.ref),
          (e.child = t),
          (t.return = e),
          t
        );
      }
      function mc(e, t, n) {
        return (
          Va(t, e.child, null, n),
          (e = pc(t, t.pendingProps)),
          (e.flags |= 2),
          po(t),
          (t.memoizedState = null),
          e
        );
      }
      function hc(e, t, n) {
        var r = t.pendingProps,
          a = (t.flags & 128) != 0;
        if (((t.flags &= -129), e === null)) {
          if (I) {
            if (r.mode === `hidden`)
              return (e = pc(t, r)), (t.lanes = 536870912), dc(null, e);
            if (
              (lo(t),
              (e = F)
                ? ((e = rf(e, zi)),
                  (e = e !== null && e.data === `&` ? e : null),
                  e !== null &&
                    ((t.memoizedState = {
                      dehydrated: e,
                      treeContext:
                        ki === null ? null : { id: Ai, overflow: ji },
                      retryLane: 536870912,
                      hydrationErrors: null,
                    }),
                    (n = yi(e)),
                    (n.return = t),
                    (t.child = n),
                    (Li = t),
                    (F = null)))
                : (e = null),
              e === null)
            )
              throw Vi(t);
            return (t.lanes = 536870912), null;
          }
          return pc(t, r);
        }
        var o = e.memoizedState;
        if (o !== null) {
          var s = o.dehydrated;
          if ((lo(t), a))
            if (t.flags & 256) (t.flags &= -257), (t = mc(e, t, n));
            else if (t.memoizedState !== null)
              (t.child = e.child), (t.flags |= 128), (t = null);
            else throw Error(i(558));
          else if (
            (oc || ta(e, t, n, !1), (a = (n & e.childLanes) !== 0), oc || a)
          ) {
            if (
              ((r = q),
              r !== null && ((s = lt(r, n)), s !== 0 && s !== o.retryLane))
            )
              throw ((o.retryLane = s), si(e, s), hu(r, e, s), ac);
            Du(), (t = mc(e, t, n));
          } else
            (e = o.treeContext),
              (F = cf(s.nextSibling)),
              (Li = t),
              (I = !0),
              (Ri = null),
              (zi = !1),
              e !== null && Ii(t, e),
              (t = pc(t, r)),
              (t.flags |= 4096);
          return t;
        }
        return (
          (e = mi(e.child, { mode: r.mode, children: r.children })),
          (e.ref = t.ref),
          (t.child = e),
          (e.return = t),
          e
        );
      }
      function gc(e, t) {
        var n = t.ref;
        if (n === null) e !== null && e.ref !== null && (t.flags |= 4194816);
        else {
          if (typeof n != `function` && typeof n != `object`)
            throw Error(i(284));
          (e === null || e.ref !== n) && (t.flags |= 4194816);
        }
      }
      function _c(e, t, n, r, i) {
        return (
          ra(t),
          (n = Do(e, t, n, r, void 0, i)),
          (r = jo()),
          e !== null && !oc
            ? (Mo(e, t, i), jc(e, t, i))
            : (I && r && Pi(t), (t.flags |= 1), sc(e, t, n, i), t.child)
        );
      }
      function vc(e, t, n, r, i, a) {
        return (
          ra(t),
          (t.updateQueue = null),
          (n = ko(t, r, n, i)),
          Oo(e),
          (r = jo()),
          e !== null && !oc
            ? (Mo(e, t, a), jc(e, t, a))
            : (I && r && Pi(t), (t.flags |= 1), sc(e, t, n, a), t.child)
        );
      }
      function yc(e, t, n, r, i) {
        if ((ra(t), t.stateNode === null)) {
          var a = ui,
            o = n.contextType;
          typeof o == `object` && o && (a = ia(o)),
            (a = new n(r, a)),
            (t.memoizedState =
              a.state !== null && a.state !== void 0 ? a.state : null),
            (a.updater = Ks),
            (t.stateNode = a),
            (a._reactInternals = t),
            (a = t.stateNode),
            (a.props = r),
            (a.state = t.memoizedState),
            (a.refs = {}),
            Wa(t),
            (o = n.contextType),
            (a.context = typeof o == `object` && o ? ia(o) : ui),
            (a.state = t.memoizedState),
            (o = n.getDerivedStateFromProps),
            typeof o == `function` &&
              (Gs(t, n, o, r), (a.state = t.memoizedState)),
            typeof n.getDerivedStateFromProps == `function` ||
              typeof a.getSnapshotBeforeUpdate == `function` ||
              (typeof a.UNSAFE_componentWillMount != `function` &&
                typeof a.componentWillMount != `function`) ||
              ((o = a.state),
              typeof a.componentWillMount == `function` &&
                a.componentWillMount(),
              typeof a.UNSAFE_componentWillMount == `function` &&
                a.UNSAFE_componentWillMount(),
              o !== a.state && Ks.enqueueReplaceState(a, a.state, null),
              Qa(t, r, a, i),
              Za(),
              (a.state = t.memoizedState)),
            typeof a.componentDidMount == `function` && (t.flags |= 4194308),
            (r = !0);
        } else if (e === null) {
          a = t.stateNode;
          var s = t.memoizedProps,
            c = Ys(n, s);
          a.props = c;
          var l = a.context,
            u = n.contextType;
          (o = ui), typeof u == `object` && u && (o = ia(u));
          var d = n.getDerivedStateFromProps;
          (u =
            typeof d == `function` ||
            typeof a.getSnapshotBeforeUpdate == `function`),
            (s = t.pendingProps !== s),
            u ||
              (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
                typeof a.componentWillReceiveProps != `function`) ||
              ((s || l !== o) && Js(t, a, r, o)),
            (Ua = !1);
          var f = t.memoizedState;
          (a.state = f),
            Qa(t, r, a, i),
            Za(),
            (l = t.memoizedState),
            s || f !== l || Ua
              ? (typeof d == `function` &&
                  (Gs(t, n, d, r), (l = t.memoizedState)),
                (c = Ua || qs(t, n, c, r, f, l, o))
                  ? (u ||
                      (typeof a.UNSAFE_componentWillMount != `function` &&
                        typeof a.componentWillMount != `function`) ||
                      (typeof a.componentWillMount == `function` &&
                        a.componentWillMount(),
                      typeof a.UNSAFE_componentWillMount == `function` &&
                        a.UNSAFE_componentWillMount()),
                    typeof a.componentDidMount == `function` &&
                      (t.flags |= 4194308))
                  : (typeof a.componentDidMount == `function` &&
                      (t.flags |= 4194308),
                    (t.memoizedProps = r),
                    (t.memoizedState = l)),
                (a.props = r),
                (a.state = l),
                (a.context = o),
                (r = c))
              : (typeof a.componentDidMount == `function` &&
                  (t.flags |= 4194308),
                (r = !1));
        } else {
          (a = t.stateNode),
            Ga(e, t),
            (o = t.memoizedProps),
            (u = Ys(n, o)),
            (a.props = u),
            (d = t.pendingProps),
            (f = a.context),
            (l = n.contextType),
            (c = ui),
            typeof l == `object` && l && (c = ia(l)),
            (s = n.getDerivedStateFromProps),
            (l =
              typeof s == `function` ||
              typeof a.getSnapshotBeforeUpdate == `function`) ||
              (typeof a.UNSAFE_componentWillReceiveProps != `function` &&
                typeof a.componentWillReceiveProps != `function`) ||
              ((o !== d || f !== c) && Js(t, a, r, c)),
            (Ua = !1),
            (f = t.memoizedState),
            (a.state = f),
            Qa(t, r, a, i),
            Za();
          var p = t.memoizedState;
          o !== d ||
          f !== p ||
          Ua ||
          (e !== null && e.dependencies !== null && na(e.dependencies))
            ? (typeof s == `function` &&
                (Gs(t, n, s, r), (p = t.memoizedState)),
              (u =
                Ua ||
                qs(t, n, u, r, f, p, c) ||
                (e !== null && e.dependencies !== null && na(e.dependencies)))
                ? (l ||
                    (typeof a.UNSAFE_componentWillUpdate != `function` &&
                      typeof a.componentWillUpdate != `function`) ||
                    (typeof a.componentWillUpdate == `function` &&
                      a.componentWillUpdate(r, p, c),
                    typeof a.UNSAFE_componentWillUpdate == `function` &&
                      a.UNSAFE_componentWillUpdate(r, p, c)),
                  typeof a.componentDidUpdate == `function` && (t.flags |= 4),
                  typeof a.getSnapshotBeforeUpdate == `function` &&
                    (t.flags |= 1024))
                : (typeof a.componentDidUpdate != `function` ||
                    (o === e.memoizedProps && f === e.memoizedState) ||
                    (t.flags |= 4),
                  typeof a.getSnapshotBeforeUpdate != `function` ||
                    (o === e.memoizedProps && f === e.memoizedState) ||
                    (t.flags |= 1024),
                  (t.memoizedProps = r),
                  (t.memoizedState = p)),
              (a.props = r),
              (a.state = p),
              (a.context = c),
              (r = u))
            : (typeof a.componentDidUpdate != `function` ||
                (o === e.memoizedProps && f === e.memoizedState) ||
                (t.flags |= 4),
              typeof a.getSnapshotBeforeUpdate != `function` ||
                (o === e.memoizedProps && f === e.memoizedState) ||
                (t.flags |= 1024),
              (r = !1));
        }
        return (
          (a = r),
          gc(e, t),
          (r = (t.flags & 128) != 0),
          a || r
            ? ((a = t.stateNode),
              (n =
                r && typeof n.getDerivedStateFromError != `function`
                  ? null
                  : a.render()),
              (t.flags |= 1),
              e !== null && r
                ? ((t.child = Va(t, e.child, null, i)),
                  (t.child = Va(t, null, n, i)))
                : sc(e, t, n, i),
              (t.memoizedState = a.state),
              (e = t.child))
            : (e = jc(e, t, i)),
          e
        );
      }
      function bc(e, t, n, r) {
        return Gi(), (t.flags |= 256), sc(e, t, n, r), t.child;
      }
      var xc = {
        dehydrated: null,
        treeContext: null,
        retryLane: 0,
        hydrationErrors: null,
      };
      function Sc(e) {
        return { baseLanes: e, cachePool: wa() };
      }
      function Cc(e, t, n) {
        return (e = e === null ? 0 : e.childLanes & ~n), t && (e |= Jl), e;
      }
      function wc(e, t, n) {
        var r = t.pendingProps,
          a = !1,
          o = (t.flags & 128) != 0,
          s;
        if (
          ((s = o) ||
            (s =
              e !== null && e.memoizedState === null
                ? !1
                : (mo.current & 2) != 0),
          s && ((a = !0), (t.flags &= -129)),
          (s = (t.flags & 32) != 0),
          (t.flags &= -33),
          e === null)
        ) {
          if (I) {
            if (
              (a ? co(t) : fo(t),
              (e = F)
                ? ((e = rf(e, zi)),
                  (e = e !== null && e.data !== `&` ? e : null),
                  e !== null &&
                    ((t.memoizedState = {
                      dehydrated: e,
                      treeContext:
                        ki === null ? null : { id: Ai, overflow: ji },
                      retryLane: 536870912,
                      hydrationErrors: null,
                    }),
                    (n = yi(e)),
                    (n.return = t),
                    (t.child = n),
                    (Li = t),
                    (F = null)))
                : (e = null),
              e === null)
            )
              throw Vi(t);
            return of(e) ? (t.lanes = 32) : (t.lanes = 536870912), null;
          }
          var c = r.children;
          return (
            (r = r.fallback),
            a
              ? (fo(t),
                (a = t.mode),
                (c = Ec({ mode: `hidden`, children: c }, a)),
                (r = _i(r, a, n, null)),
                (c.return = t),
                (r.return = t),
                (c.sibling = r),
                (t.child = c),
                (r = t.child),
                (r.memoizedState = Sc(n)),
                (r.childLanes = Cc(e, s, n)),
                (t.memoizedState = xc),
                dc(null, r))
              : (co(t), Tc(t, c))
          );
        }
        var l = e.memoizedState;
        if (l !== null && ((c = l.dehydrated), c !== null)) {
          if (o)
            t.flags & 256
              ? (co(t), (t.flags &= -257), (t = Dc(e, t, n)))
              : t.memoizedState === null
                ? (fo(t),
                  (c = r.fallback),
                  (a = t.mode),
                  (r = Ec({ mode: `visible`, children: r.children }, a)),
                  (c = _i(c, a, n, null)),
                  (c.flags |= 2),
                  (r.return = t),
                  (c.return = t),
                  (r.sibling = c),
                  (t.child = r),
                  Va(t, e.child, null, n),
                  (r = t.child),
                  (r.memoizedState = Sc(n)),
                  (r.childLanes = Cc(e, s, n)),
                  (t.memoizedState = xc),
                  (t = dc(null, r)))
                : (fo(t), (t.child = e.child), (t.flags |= 128), (t = null));
          else if ((co(t), of(c))) {
            if (((s = c.nextSibling && c.nextSibling.dataset), s))
              var u = s.dgst;
            (s = u),
              (r = Error(i(419))),
              (r.stack = ``),
              (r.digest = s),
              qi({ value: r, source: null, stack: null }),
              (t = Dc(e, t, n));
          } else if (
            (oc || ta(e, t, n, !1), (s = (n & e.childLanes) !== 0), oc || s)
          ) {
            if (
              ((s = q),
              s !== null && ((r = lt(s, n)), r !== 0 && r !== l.retryLane))
            )
              throw ((l.retryLane = r), si(e, r), hu(s, e, r), ac);
            af(c) || Du(), (t = Dc(e, t, n));
          } else
            af(c)
              ? ((t.flags |= 192), (t.child = e.child), (t = null))
              : ((e = l.treeContext),
                (F = cf(c.nextSibling)),
                (Li = t),
                (I = !0),
                (Ri = null),
                (zi = !1),
                e !== null && Ii(t, e),
                (t = Tc(t, r.children)),
                (t.flags |= 4096));
          return t;
        }
        return a
          ? (fo(t),
            (c = r.fallback),
            (a = t.mode),
            (l = e.child),
            (u = l.sibling),
            (r = mi(l, { mode: `hidden`, children: r.children })),
            (r.subtreeFlags = l.subtreeFlags & 65011712),
            u === null
              ? ((c = _i(c, a, n, null)), (c.flags |= 2))
              : (c = mi(u, c)),
            (c.return = t),
            (r.return = t),
            (r.sibling = c),
            (t.child = r),
            dc(null, r),
            (r = t.child),
            (c = e.child.memoizedState),
            c === null
              ? (c = Sc(n))
              : ((a = c.cachePool),
                a === null
                  ? (a = wa())
                  : ((l = ua._currentValue),
                    (a = a.parent === l ? a : { parent: l, pool: l })),
                (c = { baseLanes: c.baseLanes | n, cachePool: a })),
            (r.memoizedState = c),
            (r.childLanes = Cc(e, s, n)),
            (t.memoizedState = xc),
            dc(e.child, r))
          : (co(t),
            (n = e.child),
            (e = n.sibling),
            (n = mi(n, { mode: `visible`, children: r.children })),
            (n.return = t),
            (n.sibling = null),
            e !== null &&
              ((s = t.deletions),
              s === null ? ((t.deletions = [e]), (t.flags |= 16)) : s.push(e)),
            (t.child = n),
            (t.memoizedState = null),
            n);
      }
      function Tc(e, t) {
        return (
          (t = Ec({ mode: `visible`, children: t }, e.mode)),
          (t.return = e),
          (e.child = t)
        );
      }
      function Ec(e, t) {
        return (e = fi(22, e, null, t)), (e.lanes = 0), e;
      }
      function Dc(e, t, n) {
        return (
          Va(t, e.child, null, n),
          (e = Tc(t, t.pendingProps.children)),
          (e.flags |= 2),
          (t.memoizedState = null),
          e
        );
      }
      function Oc(e, t, n) {
        e.lanes |= t;
        var r = e.alternate;
        r !== null && (r.lanes |= t), $i(e.return, t, n);
      }
      function kc(e, t, n, r, i, a) {
        var o = e.memoizedState;
        o === null
          ? (e.memoizedState = {
              isBackwards: t,
              rendering: null,
              renderingStartTime: 0,
              last: r,
              tail: n,
              tailMode: i,
              treeForkCount: a,
            })
          : ((o.isBackwards = t),
            (o.rendering = null),
            (o.renderingStartTime = 0),
            (o.last = r),
            (o.tail = n),
            (o.tailMode = i),
            (o.treeForkCount = a));
      }
      function Ac(e, t, n) {
        var r = t.pendingProps,
          i = r.revealOrder,
          a = r.tail;
        r = r.children;
        var o = mo.current,
          s = (o & 2) != 0;
        if (
          (s ? ((o = (o & 1) | 2), (t.flags |= 128)) : (o &= 1),
          D(mo, o),
          sc(e, t, r, n),
          (r = I ? Ei : 0),
          !s && e !== null && e.flags & 128)
        )
          a: for (e = t.child; e !== null; ) {
            if (e.tag === 13) e.memoizedState !== null && Oc(e, n, t);
            else if (e.tag === 19) Oc(e, n, t);
            else if (e.child !== null) {
              (e.child.return = e), (e = e.child);
              continue;
            }
            if (e === t) break;
            for (; e.sibling === null; ) {
              if (e.return === null || e.return === t) break a;
              e = e.return;
            }
            (e.sibling.return = e.return), (e = e.sibling);
          }
        switch (i) {
          case `forwards`:
            for (n = t.child, i = null; n !== null; )
              (e = n.alternate),
                e !== null && ho(e) === null && (i = n),
                (n = n.sibling);
            (n = i),
              n === null
                ? ((i = t.child), (t.child = null))
                : ((i = n.sibling), (n.sibling = null)),
              kc(t, !1, i, n, a, r);
            break;
          case `backwards`:
          case `unstable_legacy-backwards`:
            for (n = null, i = t.child, t.child = null; i !== null; ) {
              if (((e = i.alternate), e !== null && ho(e) === null)) {
                t.child = i;
                break;
              }
              (e = i.sibling), (i.sibling = n), (n = i), (i = e);
            }
            kc(t, !0, n, null, a, r);
            break;
          case `together`:
            kc(t, !1, null, null, void 0, r);
            break;
          default:
            t.memoizedState = null;
        }
        return t.child;
      }
      function jc(e, t, n) {
        if (
          (e !== null && (t.dependencies = e.dependencies),
          (Gl |= t.lanes),
          (n & t.childLanes) === 0)
        )
          if (e !== null) {
            if ((ta(e, t, n, !1), (n & t.childLanes) === 0)) return null;
          } else return null;
        if (e !== null && t.child !== e.child) throw Error(i(153));
        if (t.child !== null) {
          for (
            e = t.child, n = mi(e, e.pendingProps), t.child = n, n.return = t;
            e.sibling !== null;
          )
            (e = e.sibling),
              (n = n.sibling = mi(e, e.pendingProps)),
              (n.return = t);
          n.sibling = null;
        }
        return t.child;
      }
      function Mc(e, t) {
        return (e.lanes & t) === 0
          ? ((e = e.dependencies), !!(e !== null && na(e)))
          : !0;
      }
      function Nc(e, t, n) {
        switch (t.tag) {
          case 3:
            O(t, t.stateNode.containerInfo),
              Zi(t, ua, e.memoizedState.cache),
              Gi();
            break;
          case 27:
          case 5:
            xe(t);
            break;
          case 4:
            O(t, t.stateNode.containerInfo);
            break;
          case 10:
            Zi(t, t.type, t.memoizedProps.value);
            break;
          case 31:
            if (t.memoizedState !== null) return (t.flags |= 128), lo(t), null;
            break;
          case 13: {
            var r = t.memoizedState;
            if (r !== null)
              return r.dehydrated === null
                ? (n & t.child.childLanes) === 0
                  ? (co(t), (e = jc(e, t, n)), e === null ? null : e.sibling)
                  : wc(e, t, n)
                : (co(t), (t.flags |= 128), null);
            co(t);
            break;
          }
          case 19: {
            var i = (e.flags & 128) != 0;
            if (
              ((r = (n & t.childLanes) !== 0),
              (r ||= (ta(e, t, n, !1), (n & t.childLanes) !== 0)),
              i)
            ) {
              if (r) return Ac(e, t, n);
              t.flags |= 128;
            }
            if (
              ((i = t.memoizedState),
              i !== null &&
                ((i.rendering = null), (i.tail = null), (i.lastEffect = null)),
              D(mo, mo.current),
              r)
            )
              break;
            return null;
          }
          case 22:
            return (t.lanes = 0), V(e, t, n, t.pendingProps);
          case 24:
            Zi(t, ua, e.memoizedState.cache);
        }
        return jc(e, t, n);
      }
      function Pc(e, t, n) {
        if (e !== null)
          if (e.memoizedProps !== t.pendingProps) oc = !0;
          else {
            if (!Mc(e, n) && !(t.flags & 128)) return (oc = !1), Nc(e, t, n);
            oc = !!(e.flags & 131072);
          }
        else (oc = !1), I && t.flags & 1048576 && Ni(t, Ei, t.index);
        switch (((t.lanes = 0), t.tag)) {
          case 16:
            a: {
              var r = t.pendingProps;
              if (
                ((e = ja(t.elementType)), (t.type = e), typeof e == `function`)
              )
                pi(e)
                  ? ((r = Ys(e, r)), (t.tag = 1), (t = yc(null, t, e, r, n)))
                  : ((t.tag = 0), (t = _c(null, t, e, r, n)));
              else {
                if (e != null) {
                  var a = e.$$typeof;
                  if (a === S) {
                    (t.tag = 11), (t = cc(null, t, e, r, n));
                    break a;
                  } else if (a === ie) {
                    (t.tag = 14), (t = lc(null, t, e, r, n));
                    break a;
                  }
                }
                throw ((t = w(e) || e), Error(i(306, t, ``)));
              }
            }
            return t;
          case 0:
            return _c(e, t, t.type, t.pendingProps, n);
          case 1:
            return (r = t.type), (a = Ys(r, t.pendingProps)), yc(e, t, r, a, n);
          case 3:
            a: {
              if ((O(t, t.stateNode.containerInfo), e === null))
                throw Error(i(387));
              r = t.pendingProps;
              var o = t.memoizedState;
              (a = o.element), Ga(e, t), Qa(t, r, null, n);
              var s = t.memoizedState;
              if (
                ((r = s.cache),
                Zi(t, ua, r),
                r !== o.cache && ea(t, [ua], n, !0),
                Za(),
                (r = s.element),
                o.isDehydrated)
              )
                if (
                  ((o = { element: r, isDehydrated: !1, cache: s.cache }),
                  (t.updateQueue.baseState = o),
                  (t.memoizedState = o),
                  t.flags & 256)
                ) {
                  t = bc(e, t, r, n);
                  break a;
                } else if (r !== a) {
                  (a = Si(Error(i(424)), t)), qi(a), (t = bc(e, t, r, n));
                  break a;
                } else {
                  switch (((e = t.stateNode.containerInfo), e.nodeType)) {
                    case 9:
                      e = e.body;
                      break;
                    default:
                      e = e.nodeName === `HTML` ? e.ownerDocument.body : e;
                  }
                  for (
                    F = cf(e.firstChild),
                      Li = t,
                      I = !0,
                      Ri = null,
                      zi = !0,
                      n = Ha(t, null, r, n),
                      t.child = n;
                    n;
                  )
                    (n.flags = (n.flags & -3) | 4096), (n = n.sibling);
                }
              else {
                if ((Gi(), r === a)) {
                  t = jc(e, t, n);
                  break a;
                }
                sc(e, t, r, n);
              }
              t = t.child;
            }
            return t;
          case 26:
            return (
              gc(e, t),
              e === null
                ? (n = kf(t.type, null, t.pendingProps, null))
                  ? (t.memoizedState = n)
                  : I ||
                    ((n = t.type),
                    (e = t.pendingProps),
                    (r = Bd(ve.current).createElement(n)),
                    (r[ht] = t),
                    (r[gt] = e),
                    Pd(r, n, e),
                    Ot(r),
                    (t.stateNode = r))
                : (t.memoizedState = kf(
                    t.type,
                    e.memoizedProps,
                    t.pendingProps,
                    e.memoizedState,
                  )),
              null
            );
          case 27:
            return (
              xe(t),
              e === null &&
                I &&
                ((r = t.stateNode = ff(t.type, t.pendingProps, ve.current)),
                (Li = t),
                (zi = !0),
                (a = F),
                Zd(t.type) ? ((lf = a), (F = cf(r.firstChild))) : (F = a)),
              sc(e, t, t.pendingProps.children, n),
              gc(e, t),
              e === null && (t.flags |= 4194304),
              t.child
            );
          case 5:
            return (
              e === null &&
                I &&
                ((a = r = F) &&
                  ((r = tf(r, t.type, t.pendingProps, zi)),
                  r === null
                    ? (a = !1)
                    : ((t.stateNode = r),
                      (Li = t),
                      (F = cf(r.firstChild)),
                      (zi = !1),
                      (a = !0))),
                a || Vi(t)),
              xe(t),
              (a = t.type),
              (o = t.pendingProps),
              (s = e === null ? null : e.memoizedProps),
              (r = o.children),
              Ud(a, o) ? (r = null) : s !== null && Ud(a, s) && (t.flags |= 32),
              t.memoizedState !== null &&
                ((a = Do(e, t, Ao, null, null, n)), (Qf._currentValue = a)),
              gc(e, t),
              sc(e, t, r, n),
              t.child
            );
          case 6:
            return (
              e === null &&
                I &&
                ((e = n = F) &&
                  ((n = nf(n, t.pendingProps, zi)),
                  n === null
                    ? (e = !1)
                    : ((t.stateNode = n), (Li = t), (F = null), (e = !0))),
                e || Vi(t)),
              null
            );
          case 13:
            return wc(e, t, n);
          case 4:
            return (
              O(t, t.stateNode.containerInfo),
              (r = t.pendingProps),
              e === null ? (t.child = Va(t, null, r, n)) : sc(e, t, r, n),
              t.child
            );
          case 11:
            return cc(e, t, t.type, t.pendingProps, n);
          case 7:
            return sc(e, t, t.pendingProps, n), t.child;
          case 8:
            return sc(e, t, t.pendingProps.children, n), t.child;
          case 12:
            return sc(e, t, t.pendingProps.children, n), t.child;
          case 10:
            return (
              (r = t.pendingProps),
              Zi(t, t.type, r.value),
              sc(e, t, r.children, n),
              t.child
            );
          case 9:
            return (
              (a = t.type._context),
              (r = t.pendingProps.children),
              ra(t),
              (a = ia(a)),
              (r = r(a)),
              (t.flags |= 1),
              sc(e, t, r, n),
              t.child
            );
          case 14:
            return lc(e, t, t.type, t.pendingProps, n);
          case 15:
            return uc(e, t, t.type, t.pendingProps, n);
          case 19:
            return Ac(e, t, n);
          case 31:
            return hc(e, t, n);
          case 22:
            return V(e, t, n, t.pendingProps);
          case 24:
            return (
              ra(t),
              (r = ia(ua)),
              e === null
                ? ((a = Sa()),
                  a === null &&
                    ((a = q),
                    (o = da()),
                    (a.pooledCache = o),
                    o.refCount++,
                    o !== null && (a.pooledCacheLanes |= n),
                    (a = o)),
                  (t.memoizedState = { parent: r, cache: a }),
                  Wa(t),
                  Zi(t, ua, a))
                : ((e.lanes & n) !== 0 &&
                    (Ga(e, t), Qa(t, null, null, n), Za()),
                  (a = e.memoizedState),
                  (o = t.memoizedState),
                  a.parent === r
                    ? ((r = o.cache),
                      Zi(t, ua, r),
                      r !== a.cache && ea(t, [ua], n, !0))
                    : ((a = { parent: r, cache: r }),
                      (t.memoizedState = a),
                      t.lanes === 0 &&
                        (t.memoizedState = t.updateQueue.baseState = a),
                      Zi(t, ua, r))),
              sc(e, t, t.pendingProps.children, n),
              t.child
            );
          case 29:
            throw t.pendingProps;
        }
        throw Error(i(156, t.tag));
      }
      function Fc(e) {
        e.flags |= 4;
      }
      function Ic(e, t, n, r, i) {
        if (((t = (e.mode & 32) != 0) && (t = !1), t)) {
          if (((e.flags |= 16777216), (i & 335544128) === i))
            if (e.stateNode.complete) e.flags |= 8192;
            else if (wu()) e.flags |= 8192;
            else throw ((Ma = Oa), Ea);
        } else e.flags &= -16777217;
      }
      function Lc(e, t) {
        if (t.type !== `stylesheet` || t.state.loading & 4)
          e.flags &= -16777217;
        else if (((e.flags |= 16777216), !Wf(t)))
          if (wu()) e.flags |= 8192;
          else throw ((Ma = Oa), Ea);
      }
      function Rc(e, t) {
        t !== null && (e.flags |= 4),
          e.flags & 16384 &&
            ((t = e.tag === 22 ? 536870912 : rt()), (e.lanes |= t), (Yl |= t));
      }
      function zc(e, t) {
        if (!I)
          switch (e.tailMode) {
            case `hidden`:
              t = e.tail;
              for (var n = null; t !== null; )
                t.alternate !== null && (n = t), (t = t.sibling);
              n === null ? (e.tail = null) : (n.sibling = null);
              break;
            case `collapsed`:
              n = e.tail;
              for (var r = null; n !== null; )
                n.alternate !== null && (r = n), (n = n.sibling);
              r === null
                ? t || e.tail === null
                  ? (e.tail = null)
                  : (e.tail.sibling = null)
                : (r.sibling = null);
          }
      }
      function H(e) {
        var t = e.alternate !== null && e.alternate.child === e.child,
          n = 0,
          r = 0;
        if (t)
          for (var i = e.child; i !== null; )
            (n |= i.lanes | i.childLanes),
              (r |= i.subtreeFlags & 65011712),
              (r |= i.flags & 65011712),
              (i.return = e),
              (i = i.sibling);
        else
          for (i = e.child; i !== null; )
            (n |= i.lanes | i.childLanes),
              (r |= i.subtreeFlags),
              (r |= i.flags),
              (i.return = e),
              (i = i.sibling);
        return (e.subtreeFlags |= r), (e.childLanes = n), t;
      }
      function Bc(e, t, n) {
        var r = t.pendingProps;
        switch ((Fi(t), t.tag)) {
          case 16:
          case 15:
          case 0:
          case 11:
          case 7:
          case 8:
          case 12:
          case 9:
          case 14:
            return H(t), null;
          case 1:
            return H(t), null;
          case 3:
            return (
              (n = t.stateNode),
              (r = null),
              e !== null && (r = e.memoizedState.cache),
              t.memoizedState.cache !== r && (t.flags |= 2048),
              Qi(ua),
              be(),
              n.pendingContext &&
                ((n.context = n.pendingContext), (n.pendingContext = null)),
              (e === null || e.child === null) &&
                (Wi(t)
                  ? Fc(t)
                  : e === null ||
                    (e.memoizedState.isDehydrated && !(t.flags & 256)) ||
                    ((t.flags |= 1024), Ki())),
              H(t),
              null
            );
          case 26: {
            var a = t.type,
              o = t.memoizedState;
            return (
              e === null
                ? (Fc(t),
                  o === null ? (H(t), Ic(t, a, null, r, n)) : (H(t), Lc(t, o)))
                : o
                  ? o === e.memoizedState
                    ? (H(t), (t.flags &= -16777217))
                    : (Fc(t), H(t), Lc(t, o))
                  : ((e = e.memoizedProps),
                    e !== r && Fc(t),
                    H(t),
                    Ic(t, a, e, r, n)),
              null
            );
          }
          case 27:
            if (
              (Se(t),
              (n = ve.current),
              (a = t.type),
              e !== null && t.stateNode != null)
            )
              e.memoizedProps !== r && Fc(t);
            else {
              if (!r) {
                if (t.stateNode === null) throw Error(i(166));
                return H(t), null;
              }
              (e = ge.current),
                Wi(t)
                  ? Hi(t, e)
                  : ((e = ff(a, r, n)), (t.stateNode = e), Fc(t));
            }
            return H(t), null;
          case 5:
            if ((Se(t), (a = t.type), e !== null && t.stateNode != null))
              e.memoizedProps !== r && Fc(t);
            else {
              if (!r) {
                if (t.stateNode === null) throw Error(i(166));
                return H(t), null;
              }
              if (((o = ge.current), Wi(t))) Hi(t, o);
              else {
                var s = Bd(ve.current);
                switch (o) {
                  case 1:
                    o = s.createElementNS(`http://www.w3.org/2000/svg`, a);
                    break;
                  case 2:
                    o = s.createElementNS(
                      `http://www.w3.org/1998/Math/MathML`,
                      a,
                    );
                    break;
                  default:
                    switch (a) {
                      case `svg`:
                        o = s.createElementNS(`http://www.w3.org/2000/svg`, a);
                        break;
                      case `math`:
                        o = s.createElementNS(
                          `http://www.w3.org/1998/Math/MathML`,
                          a,
                        );
                        break;
                      case `script`:
                        (o = s.createElement(`div`)),
                          (o.innerHTML = `<script></script>`),
                          (o = o.removeChild(o.firstChild));
                        break;
                      case `select`:
                        (o =
                          typeof r.is == `string`
                            ? s.createElement(`select`, { is: r.is })
                            : s.createElement(`select`)),
                          r.multiple
                            ? (o.multiple = !0)
                            : r.size && (o.size = r.size);
                        break;
                      default:
                        o =
                          typeof r.is == `string`
                            ? s.createElement(a, { is: r.is })
                            : s.createElement(a);
                    }
                }
                (o[ht] = t), (o[gt] = r);
                a: for (s = t.child; s !== null; ) {
                  if (s.tag === 5 || s.tag === 6) o.appendChild(s.stateNode);
                  else if (s.tag !== 4 && s.tag !== 27 && s.child !== null) {
                    (s.child.return = s), (s = s.child);
                    continue;
                  }
                  if (s === t) break;
                  for (; s.sibling === null; ) {
                    if (s.return === null || s.return === t) break a;
                    s = s.return;
                  }
                  (s.sibling.return = s.return), (s = s.sibling);
                }
                t.stateNode = o;
                switch ((Pd(o, a, r), a)) {
                  case `button`:
                  case `input`:
                  case `select`:
                  case `textarea`:
                    r = !!r.autoFocus;
                    break;
                  case `img`:
                    r = !0;
                    break;
                  default:
                    r = !1;
                }
                r && Fc(t);
              }
            }
            return (
              H(t),
              Ic(
                t,
                t.type,
                e === null ? null : e.memoizedProps,
                t.pendingProps,
                n,
              ),
              null
            );
          case 6:
            if (e && t.stateNode != null) e.memoizedProps !== r && Fc(t);
            else {
              if (typeof r != `string` && t.stateNode === null)
                throw Error(i(166));
              if (((e = ve.current), Wi(t))) {
                if (
                  ((e = t.stateNode),
                  (n = t.memoizedProps),
                  (r = null),
                  (a = Li),
                  a !== null)
                )
                  switch (a.tag) {
                    case 27:
                    case 5:
                      r = a.memoizedProps;
                  }
                (e[ht] = t),
                  (e = !!(
                    e.nodeValue === n ||
                    (r !== null && !0 === r.suppressHydrationWarning) ||
                    Md(e.nodeValue, n)
                  )),
                  e || Vi(t, !0);
              } else
                (e = Bd(e).createTextNode(r)), (e[ht] = t), (t.stateNode = e);
            }
            return H(t), null;
          case 31:
            if (
              ((n = t.memoizedState), e === null || e.memoizedState !== null)
            ) {
              if (((r = Wi(t)), n !== null)) {
                if (e === null) {
                  if (!r) throw Error(i(318));
                  if (
                    ((e = t.memoizedState),
                    (e = e === null ? null : e.dehydrated),
                    !e)
                  )
                    throw Error(i(557));
                  e[ht] = t;
                } else
                  Gi(),
                    !(t.flags & 128) && (t.memoizedState = null),
                    (t.flags |= 4);
                H(t), (e = !1);
              } else
                (n = Ki()),
                  e !== null &&
                    e.memoizedState !== null &&
                    (e.memoizedState.hydrationErrors = n),
                  (e = !0);
              if (!e) return t.flags & 256 ? (po(t), t) : (po(t), null);
              if (t.flags & 128) throw Error(i(558));
            }
            return H(t), null;
          case 13:
            if (
              ((r = t.memoizedState),
              e === null ||
                (e.memoizedState !== null &&
                  e.memoizedState.dehydrated !== null))
            ) {
              if (((a = Wi(t)), r !== null && r.dehydrated !== null)) {
                if (e === null) {
                  if (!a) throw Error(i(318));
                  if (
                    ((a = t.memoizedState),
                    (a = a === null ? null : a.dehydrated),
                    !a)
                  )
                    throw Error(i(317));
                  a[ht] = t;
                } else
                  Gi(),
                    !(t.flags & 128) && (t.memoizedState = null),
                    (t.flags |= 4);
                H(t), (a = !1);
              } else
                (a = Ki()),
                  e !== null &&
                    e.memoizedState !== null &&
                    (e.memoizedState.hydrationErrors = a),
                  (a = !0);
              if (!a) return t.flags & 256 ? (po(t), t) : (po(t), null);
            }
            return (
              po(t),
              t.flags & 128
                ? ((t.lanes = n), t)
                : ((n = r !== null),
                  (e = e !== null && e.memoizedState !== null),
                  n &&
                    ((r = t.child),
                    (a = null),
                    r.alternate !== null &&
                      r.alternate.memoizedState !== null &&
                      r.alternate.memoizedState.cachePool !== null &&
                      (a = r.alternate.memoizedState.cachePool.pool),
                    (o = null),
                    r.memoizedState !== null &&
                      r.memoizedState.cachePool !== null &&
                      (o = r.memoizedState.cachePool.pool),
                    o !== a && (r.flags |= 2048)),
                  n !== e && n && (t.child.flags |= 8192),
                  Rc(t, t.updateQueue),
                  H(t),
                  null)
            );
          case 4:
            return (
              be(), e === null && Sd(t.stateNode.containerInfo), H(t), null
            );
          case 10:
            return Qi(t.type), H(t), null;
          case 19:
            if ((he(mo), (r = t.memoizedState), r === null)) return H(t), null;
            if (((a = (t.flags & 128) != 0), (o = r.rendering), o === null))
              if (a) zc(r, !1);
              else {
                if (Wl !== 0 || (e !== null && e.flags & 128))
                  for (e = t.child; e !== null; ) {
                    if (((o = ho(e)), o !== null)) {
                      for (
                        t.flags |= 128,
                          zc(r, !1),
                          e = o.updateQueue,
                          t.updateQueue = e,
                          Rc(t, e),
                          t.subtreeFlags = 0,
                          e = n,
                          n = t.child;
                        n !== null;
                      )
                        hi(n, e), (n = n.sibling);
                      return (
                        D(mo, (mo.current & 1) | 2),
                        I && Mi(t, r.treeForkCount),
                        t.child
                      );
                    }
                    e = e.sibling;
                  }
                r.tail !== null &&
                  Pe() > tu &&
                  ((t.flags |= 128), (a = !0), zc(r, !1), (t.lanes = 4194304));
              }
            else {
              if (!a)
                if (((e = ho(o)), e !== null)) {
                  if (
                    ((t.flags |= 128),
                    (a = !0),
                    (e = e.updateQueue),
                    (t.updateQueue = e),
                    Rc(t, e),
                    zc(r, !0),
                    r.tail === null &&
                      r.tailMode === `hidden` &&
                      !o.alternate &&
                      !I)
                  )
                    return H(t), null;
                } else
                  2 * Pe() - r.renderingStartTime > tu &&
                    n !== 536870912 &&
                    ((t.flags |= 128),
                    (a = !0),
                    zc(r, !1),
                    (t.lanes = 4194304));
              r.isBackwards
                ? ((o.sibling = t.child), (t.child = o))
                : ((e = r.last),
                  e === null ? (t.child = o) : (e.sibling = o),
                  (r.last = o));
            }
            return r.tail === null
              ? (H(t), null)
              : ((e = r.tail),
                (r.rendering = e),
                (r.tail = e.sibling),
                (r.renderingStartTime = Pe()),
                (e.sibling = null),
                (n = mo.current),
                D(mo, a ? (n & 1) | 2 : n & 1),
                I && Mi(t, r.treeForkCount),
                e);
          case 22:
          case 23:
            return (
              po(t),
              ao(),
              (r = t.memoizedState !== null),
              e === null
                ? r && (t.flags |= 8192)
                : (e.memoizedState !== null) !== r && (t.flags |= 8192),
              r
                ? n & 536870912 &&
                  !(t.flags & 128) &&
                  (H(t), t.subtreeFlags & 6 && (t.flags |= 8192))
                : H(t),
              (n = t.updateQueue),
              n !== null && Rc(t, n.retryQueue),
              (n = null),
              e !== null &&
                e.memoizedState !== null &&
                e.memoizedState.cachePool !== null &&
                (n = e.memoizedState.cachePool.pool),
              (r = null),
              t.memoizedState !== null &&
                t.memoizedState.cachePool !== null &&
                (r = t.memoizedState.cachePool.pool),
              r !== n && (t.flags |= 2048),
              e !== null && he(xa),
              null
            );
          case 24:
            return (
              (n = null),
              e !== null && (n = e.memoizedState.cache),
              t.memoizedState.cache !== n && (t.flags |= 2048),
              Qi(ua),
              H(t),
              null
            );
          case 25:
            return null;
          case 30:
            return null;
        }
        throw Error(i(156, t.tag));
      }
      function Vc(e, t) {
        switch ((Fi(t), t.tag)) {
          case 1:
            return (
              (e = t.flags),
              e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
          case 3:
            return (
              Qi(ua),
              be(),
              (e = t.flags),
              e & 65536 && !(e & 128)
                ? ((t.flags = (e & -65537) | 128), t)
                : null
            );
          case 26:
          case 27:
          case 5:
            return Se(t), null;
          case 31:
            if (t.memoizedState !== null) {
              if ((po(t), t.alternate === null)) throw Error(i(340));
              Gi();
            }
            return (
              (e = t.flags),
              e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
          case 13:
            if (
              (po(t),
              (e = t.memoizedState),
              e !== null && e.dehydrated !== null)
            ) {
              if (t.alternate === null) throw Error(i(340));
              Gi();
            }
            return (
              (e = t.flags),
              e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
          case 19:
            return he(mo), null;
          case 4:
            return be(), null;
          case 10:
            return Qi(t.type), null;
          case 22:
          case 23:
            return (
              po(t),
              ao(),
              e !== null && he(xa),
              (e = t.flags),
              e & 65536 ? ((t.flags = (e & -65537) | 128), t) : null
            );
          case 24:
            return Qi(ua), null;
          case 25:
            return null;
          default:
            return null;
        }
      }
      function Hc(e, t) {
        switch ((Fi(t), t.tag)) {
          case 3:
            Qi(ua), be();
            break;
          case 26:
          case 27:
          case 5:
            Se(t);
            break;
          case 4:
            be();
            break;
          case 31:
            t.memoizedState !== null && po(t);
            break;
          case 13:
            po(t);
            break;
          case 19:
            he(mo);
            break;
          case 10:
            Qi(t.type);
            break;
          case 22:
          case 23:
            po(t), ao(), e !== null && he(xa);
            break;
          case 24:
            Qi(ua);
        }
      }
      function Uc(e, t) {
        try {
          var n = t.updateQueue,
            r = n === null ? null : n.lastEffect;
          if (r !== null) {
            var i = r.next;
            n = i;
            do {
              if ((n.tag & e) === e) {
                r = void 0;
                var a = n.create,
                  o = n.inst;
                (r = a()), (o.destroy = r);
              }
              n = n.next;
            } while (n !== i);
          }
        } catch (e) {
          Z(t, t.return, e);
        }
      }
      function Wc(e, t, n) {
        try {
          var r = t.updateQueue,
            i = r === null ? null : r.lastEffect;
          if (i !== null) {
            var a = i.next;
            r = a;
            do {
              if ((r.tag & e) === e) {
                var o = r.inst,
                  s = o.destroy;
                if (s !== void 0) {
                  (o.destroy = void 0), (i = t);
                  var c = n,
                    l = s;
                  try {
                    l();
                  } catch (e) {
                    Z(i, c, e);
                  }
                }
              }
              r = r.next;
            } while (r !== a);
          }
        } catch (e) {
          Z(t, t.return, e);
        }
      }
      function Gc(e) {
        var t = e.updateQueue;
        if (t !== null) {
          var n = e.stateNode;
          try {
            eo(t, n);
          } catch (t) {
            Z(e, e.return, t);
          }
        }
      }
      function Kc(e, t, n) {
        (n.props = Ys(e.type, e.memoizedProps)), (n.state = e.memoizedState);
        try {
          n.componentWillUnmount();
        } catch (n) {
          Z(e, t, n);
        }
      }
      function qc(e, t) {
        try {
          var n = e.ref;
          if (n !== null) {
            switch (e.tag) {
              case 26:
              case 27:
              case 5: {
                var r = e.stateNode;
                break;
              }
              case 30:
                r = e.stateNode;
                break;
              default:
                r = e.stateNode;
            }
            typeof n == `function` ? (e.refCleanup = n(r)) : (n.current = r);
          }
        } catch (n) {
          Z(e, t, n);
        }
      }
      function Jc(e, t) {
        var n = e.ref,
          r = e.refCleanup;
        if (n !== null)
          if (typeof r == `function`)
            try {
              r();
            } catch (n) {
              Z(e, t, n);
            } finally {
              (e.refCleanup = null),
                (e = e.alternate),
                e != null && (e.refCleanup = null);
            }
          else if (typeof n == `function`)
            try {
              n(null);
            } catch (n) {
              Z(e, t, n);
            }
          else n.current = null;
      }
      function Yc(e) {
        var t = e.type,
          n = e.memoizedProps,
          r = e.stateNode;
        try {
          switch (t) {
            case `button`:
            case `input`:
            case `select`:
            case `textarea`:
              n.autoFocus && r.focus();
              break;
            case `img`:
              n.src ? (r.src = n.src) : n.srcSet && (r.srcset = n.srcSet);
          }
        } catch (t) {
          Z(e, e.return, t);
        }
      }
      function Xc(e, t, n) {
        try {
          var r = e.stateNode;
          Fd(r, e.type, n, t), (r[gt] = t);
        } catch (t) {
          Z(e, e.return, t);
        }
      }
      function Zc(e) {
        return (
          e.tag === 5 ||
          e.tag === 3 ||
          e.tag === 26 ||
          (e.tag === 27 && Zd(e.type)) ||
          e.tag === 4
        );
      }
      function Qc(e) {
        a: for (;;) {
          for (; e.sibling === null; ) {
            if (e.return === null || Zc(e.return)) return null;
            e = e.return;
          }
          for (
            e.sibling.return = e.return, e = e.sibling;
            e.tag !== 5 && e.tag !== 6 && e.tag !== 18;
          ) {
            if (
              (e.tag === 27 && Zd(e.type)) ||
              e.flags & 2 ||
              e.child === null ||
              e.tag === 4
            )
              continue a;
            (e.child.return = e), (e = e.child);
          }
          if (!(e.flags & 2)) return e.stateNode;
        }
      }
      function $c(e, t, n) {
        var r = e.tag;
        if (r === 5 || r === 6)
          (e = e.stateNode),
            t
              ? (n.nodeType === 9
                  ? n.body
                  : n.nodeName === `HTML`
                    ? n.ownerDocument.body
                    : n
                ).insertBefore(e, t)
              : ((t =
                  n.nodeType === 9
                    ? n.body
                    : n.nodeName === `HTML`
                      ? n.ownerDocument.body
                      : n),
                t.appendChild(e),
                (n = n._reactRootContainer),
                n != null || t.onclick !== null || (t.onclick = cn));
        else if (
          r !== 4 &&
          (r === 27 && Zd(e.type) && ((n = e.stateNode), (t = null)),
          (e = e.child),
          e !== null)
        )
          for ($c(e, t, n), e = e.sibling; e !== null; )
            $c(e, t, n), (e = e.sibling);
      }
      function el(e, t, n) {
        var r = e.tag;
        if (r === 5 || r === 6)
          (e = e.stateNode), t ? n.insertBefore(e, t) : n.appendChild(e);
        else if (
          r !== 4 &&
          (r === 27 && Zd(e.type) && (n = e.stateNode),
          (e = e.child),
          e !== null)
        )
          for (el(e, t, n), e = e.sibling; e !== null; )
            el(e, t, n), (e = e.sibling);
      }
      function tl(e) {
        var t = e.stateNode,
          n = e.memoizedProps;
        try {
          for (var r = e.type, i = t.attributes; i.length; )
            t.removeAttributeNode(i[0]);
          Pd(t, r, n), (t[ht] = e), (t[gt] = n);
        } catch (t) {
          Z(e, e.return, t);
        }
      }
      var nl = !1,
        U = !1,
        rl = !1,
        il = typeof WeakSet == `function` ? WeakSet : Set,
        al = null;
      function ol(e, t) {
        if (((e = e.containerInfo), (Rd = sp), (e = Nr(e)), Pr(e))) {
          if (`selectionStart` in e)
            var n = { start: e.selectionStart, end: e.selectionEnd };
          else
            a: {
              n = ((n = e.ownerDocument) && n.defaultView) || window;
              var r = n.getSelection && n.getSelection();
              if (r && r.rangeCount !== 0) {
                n = r.anchorNode;
                var a = r.anchorOffset,
                  o = r.focusNode;
                r = r.focusOffset;
                try {
                  n.nodeType, o.nodeType;
                } catch {
                  n = null;
                  break a;
                }
                var s = 0,
                  c = -1,
                  l = -1,
                  u = 0,
                  d = 0,
                  f = e,
                  p = null;
                b: for (;;) {
                  for (
                    var m;
                    f !== n || (a !== 0 && f.nodeType !== 3) || (c = s + a),
                      f !== o || (r !== 0 && f.nodeType !== 3) || (l = s + r),
                      f.nodeType === 3 && (s += f.nodeValue.length),
                      (m = f.firstChild) !== null;
                  )
                    (p = f), (f = m);
                  for (;;) {
                    if (f === e) break b;
                    if (
                      (p === n && ++u === a && (c = s),
                      p === o && ++d === r && (l = s),
                      (m = f.nextSibling) !== null)
                    )
                      break;
                    (f = p), (p = f.parentNode);
                  }
                  f = m;
                }
                n = c === -1 || l === -1 ? null : { start: c, end: l };
              } else n = null;
            }
          n ||= { start: 0, end: 0 };
        } else n = null;
        for (
          zd = { focusedElem: e, selectionRange: n }, sp = !1, al = t;
          al !== null;
        )
          if (((t = al), (e = t.child), t.subtreeFlags & 1028 && e !== null))
            (e.return = t), (al = e);
          else
            for (; al !== null; ) {
              switch (((t = al), (o = t.alternate), (e = t.flags), t.tag)) {
                case 0:
                  if (
                    e & 4 &&
                    ((e = t.updateQueue),
                    (e = e === null ? null : e.events),
                    e !== null)
                  )
                    for (n = 0; n < e.length; n++)
                      (a = e[n]), (a.ref.impl = a.nextImpl);
                  break;
                case 11:
                case 15:
                  break;
                case 1:
                  if (e & 1024 && o !== null) {
                    (e = void 0),
                      (n = t),
                      (a = o.memoizedProps),
                      (o = o.memoizedState),
                      (r = n.stateNode);
                    try {
                      var h = Ys(n.type, a);
                      (e = r.getSnapshotBeforeUpdate(h, o)),
                        (r.__reactInternalSnapshotBeforeUpdate = e);
                    } catch (e) {
                      Z(n, n.return, e);
                    }
                  }
                  break;
                case 3:
                  if (e & 1024) {
                    if (
                      ((e = t.stateNode.containerInfo),
                      (n = e.nodeType),
                      n === 9)
                    )
                      ef(e);
                    else if (n === 1)
                      switch (e.nodeName) {
                        case `HEAD`:
                        case `HTML`:
                        case `BODY`:
                          ef(e);
                          break;
                        default:
                          e.textContent = ``;
                      }
                  }
                  break;
                case 5:
                case 26:
                case 27:
                case 6:
                case 4:
                case 17:
                  break;
                default:
                  if (e & 1024) throw Error(i(163));
              }
              if (((e = t.sibling), e !== null)) {
                (e.return = t.return), (al = e);
                break;
              }
              al = t.return;
            }
      }
      function sl(e, t, n) {
        var r = n.flags;
        switch (n.tag) {
          case 0:
          case 11:
          case 15:
            bl(e, n), r & 4 && Uc(5, n);
            break;
          case 1:
            if ((bl(e, n), r & 4))
              if (((e = n.stateNode), t === null))
                try {
                  e.componentDidMount();
                } catch (e) {
                  Z(n, n.return, e);
                }
              else {
                var i = Ys(n.type, t.memoizedProps);
                t = t.memoizedState;
                try {
                  e.componentDidUpdate(
                    i,
                    t,
                    e.__reactInternalSnapshotBeforeUpdate,
                  );
                } catch (e) {
                  Z(n, n.return, e);
                }
              }
            r & 64 && Gc(n), r & 512 && qc(n, n.return);
            break;
          case 3:
            if ((bl(e, n), r & 64 && ((e = n.updateQueue), e !== null))) {
              if (((t = null), n.child !== null))
                switch (n.child.tag) {
                  case 27:
                  case 5:
                    t = n.child.stateNode;
                    break;
                  case 1:
                    t = n.child.stateNode;
                }
              try {
                eo(e, t);
              } catch (e) {
                Z(n, n.return, e);
              }
            }
            break;
          case 27:
            t === null && r & 4 && tl(n);
          case 26:
          case 5:
            bl(e, n), t === null && r & 4 && Yc(n), r & 512 && qc(n, n.return);
            break;
          case 12:
            bl(e, n);
            break;
          case 31:
            bl(e, n), r & 4 && fl(e, n);
            break;
          case 13:
            bl(e, n),
              r & 4 && pl(e, n),
              r & 64 &&
                ((e = n.memoizedState),
                e !== null &&
                  ((e = e.dehydrated),
                  e !== null && ((n = Ju.bind(null, n)), sf(e, n))));
            break;
          case 22:
            if (((r = n.memoizedState !== null || nl), !r)) {
              (t = (t !== null && t.memoizedState !== null) || U), (i = nl);
              var a = U;
              (nl = r),
                (U = t) && !a
                  ? Sl(e, n, (n.subtreeFlags & 8772) != 0)
                  : bl(e, n),
                (nl = i),
                (U = a);
            }
            break;
          case 30:
            break;
          default:
            bl(e, n);
        }
      }
      function cl(e) {
        var t = e.alternate;
        t !== null && ((e.alternate = null), cl(t)),
          (e.child = null),
          (e.deletions = null),
          (e.sibling = null),
          e.tag === 5 && ((t = e.stateNode), t !== null && Ct(t)),
          (e.stateNode = null),
          (e.return = null),
          (e.dependencies = null),
          (e.memoizedProps = null),
          (e.memoizedState = null),
          (e.pendingProps = null),
          (e.stateNode = null),
          (e.updateQueue = null);
      }
      var W = null,
        ll = !1;
      function ul(e, t, n) {
        for (n = n.child; n !== null; ) dl(e, t, n), (n = n.sibling);
      }
      function dl(e, t, n) {
        if (We && typeof We.onCommitFiberUnmount == `function`)
          try {
            We.onCommitFiberUnmount(Ue, n);
          } catch {}
        switch (n.tag) {
          case 26:
            U || Jc(n, t),
              ul(e, t, n),
              n.memoizedState
                ? n.memoizedState.count--
                : n.stateNode &&
                  ((n = n.stateNode), n.parentNode.removeChild(n));
            break;
          case 27: {
            U || Jc(n, t);
            var r = W,
              i = ll;
            Zd(n.type) && ((W = n.stateNode), (ll = !1)),
              ul(e, t, n),
              pf(n.stateNode),
              (W = r),
              (ll = i);
            break;
          }
          case 5:
            U || Jc(n, t);
          case 6:
            if (
              ((r = W),
              (i = ll),
              (W = null),
              ul(e, t, n),
              (W = r),
              (ll = i),
              W !== null)
            )
              if (ll)
                try {
                  (W.nodeType === 9
                    ? W.body
                    : W.nodeName === `HTML`
                      ? W.ownerDocument.body
                      : W
                  ).removeChild(n.stateNode);
                } catch (e) {
                  Z(n, t, e);
                }
              else
                try {
                  W.removeChild(n.stateNode);
                } catch (e) {
                  Z(n, t, e);
                }
            break;
          case 18:
            W !== null &&
              (ll
                ? ((e = W),
                  Qd(
                    e.nodeType === 9
                      ? e.body
                      : e.nodeName === `HTML`
                        ? e.ownerDocument.body
                        : e,
                    n.stateNode,
                  ),
                  Np(e))
                : Qd(W, n.stateNode));
            break;
          case 4:
            (r = W),
              (i = ll),
              (W = n.stateNode.containerInfo),
              (ll = !0),
              ul(e, t, n),
              (W = r),
              (ll = i);
            break;
          case 0:
          case 11:
          case 14:
          case 15:
            Wc(2, n, t), U || Wc(4, n, t), ul(e, t, n);
            break;
          case 1:
            U ||
              (Jc(n, t),
              (r = n.stateNode),
              typeof r.componentWillUnmount == `function` && Kc(n, t, r)),
              ul(e, t, n);
            break;
          case 21:
            ul(e, t, n);
            break;
          case 22:
            (U = (r = U) || n.memoizedState !== null), ul(e, t, n), (U = r);
            break;
          default:
            ul(e, t, n);
        }
      }
      function fl(e, t) {
        if (
          t.memoizedState === null &&
          ((e = t.alternate), e !== null && ((e = e.memoizedState), e !== null))
        ) {
          e = e.dehydrated;
          try {
            Np(e);
          } catch (e) {
            Z(t, t.return, e);
          }
        }
      }
      function pl(e, t) {
        if (
          t.memoizedState === null &&
          ((e = t.alternate),
          e !== null &&
            ((e = e.memoizedState),
            e !== null && ((e = e.dehydrated), e !== null)))
        )
          try {
            Np(e);
          } catch (e) {
            Z(t, t.return, e);
          }
      }
      function ml(e) {
        switch (e.tag) {
          case 31:
          case 13:
          case 19: {
            var t = e.stateNode;
            return t === null && (t = e.stateNode = new il()), t;
          }
          case 22:
            return (
              (e = e.stateNode),
              (t = e._retryCache),
              t === null && (t = e._retryCache = new il()),
              t
            );
          default:
            throw Error(i(435, e.tag));
        }
      }
      function hl(e, t) {
        var n = ml(e);
        t.forEach((t) => {
          if (!n.has(t)) {
            n.add(t);
            var r = Yu.bind(null, e, t);
            t.then(r, r);
          }
        });
      }
      function gl(e, t) {
        var n = t.deletions;
        if (n !== null)
          for (var r = 0; r < n.length; r++) {
            var a = n[r],
              o = e,
              s = t,
              c = s;
            a: for (; c !== null; ) {
              switch (c.tag) {
                case 27:
                  if (Zd(c.type)) {
                    (W = c.stateNode), (ll = !1);
                    break a;
                  }
                  break;
                case 5:
                  (W = c.stateNode), (ll = !1);
                  break a;
                case 3:
                case 4:
                  (W = c.stateNode.containerInfo), (ll = !0);
                  break a;
              }
              c = c.return;
            }
            if (W === null) throw Error(i(160));
            dl(o, s, a),
              (W = null),
              (ll = !1),
              (o = a.alternate),
              o !== null && (o.return = null),
              (a.return = null);
          }
        if (t.subtreeFlags & 13886)
          for (t = t.child; t !== null; ) vl(t, e), (t = t.sibling);
      }
      var _l = null;
      function vl(e, t) {
        var n = e.alternate,
          r = e.flags;
        switch (e.tag) {
          case 0:
          case 11:
          case 14:
          case 15:
            gl(t, e),
              yl(e),
              r & 4 && (Wc(3, e, e.return), Uc(3, e), Wc(5, e, e.return));
            break;
          case 1:
            gl(t, e),
              yl(e),
              r & 512 && (U || n === null || Jc(n, n.return)),
              r & 64 &&
                nl &&
                ((e = e.updateQueue),
                e !== null &&
                  ((r = e.callbacks),
                  r !== null &&
                    ((n = e.shared.hiddenCallbacks),
                    (e.shared.hiddenCallbacks =
                      n === null ? r : n.concat(r)))));
            break;
          case 26: {
            var a = _l;
            if (
              (gl(t, e),
              yl(e),
              r & 512 && (U || n === null || Jc(n, n.return)),
              r & 4)
            ) {
              var o = n === null ? null : n.memoizedState;
              if (((r = e.memoizedState), n === null))
                if (r === null)
                  if (e.stateNode === null) {
                    a: {
                      (r = e.type),
                        (n = e.memoizedProps),
                        (a = a.ownerDocument || a);
                      b: switch (r) {
                        case `title`:
                          (o = a.getElementsByTagName(`title`)[0]),
                            (!o ||
                              o[St] ||
                              o[ht] ||
                              o.namespaceURI === `http://www.w3.org/2000/svg` ||
                              o.hasAttribute(`itemprop`)) &&
                              ((o = a.createElement(r)),
                              a.head.insertBefore(
                                o,
                                a.querySelector(`head > title`),
                              )),
                            Pd(o, r, n),
                            (o[ht] = e),
                            Ot(o),
                            (r = o);
                          break a;
                        case `link`: {
                          var s = Vf(`link`, `href`, a).get(r + (n.href || ``));
                          if (s) {
                            for (var c = 0; c < s.length; c++)
                              if (
                                ((o = s[c]),
                                o.getAttribute(`href`) ===
                                  (n.href == null || n.href === ``
                                    ? null
                                    : n.href) &&
                                  o.getAttribute(`rel`) ===
                                    (n.rel == null ? null : n.rel) &&
                                  o.getAttribute(`title`) ===
                                    (n.title == null ? null : n.title) &&
                                  o.getAttribute(`crossorigin`) ===
                                    (n.crossOrigin == null
                                      ? null
                                      : n.crossOrigin))
                              ) {
                                s.splice(c, 1);
                                break b;
                              }
                          }
                          (o = a.createElement(r)),
                            Pd(o, r, n),
                            a.head.appendChild(o);
                          break;
                        }
                        case `meta`:
                          if (
                            (s = Vf(`meta`, `content`, a).get(
                              r + (n.content || ``),
                            ))
                          ) {
                            for (c = 0; c < s.length; c++)
                              if (
                                ((o = s[c]),
                                o.getAttribute(`content`) ===
                                  (n.content == null ? null : `` + n.content) &&
                                  o.getAttribute(`name`) ===
                                    (n.name == null ? null : n.name) &&
                                  o.getAttribute(`property`) ===
                                    (n.property == null ? null : n.property) &&
                                  o.getAttribute(`http-equiv`) ===
                                    (n.httpEquiv == null
                                      ? null
                                      : n.httpEquiv) &&
                                  o.getAttribute(`charset`) ===
                                    (n.charSet == null ? null : n.charSet))
                              ) {
                                s.splice(c, 1);
                                break b;
                              }
                          }
                          (o = a.createElement(r)),
                            Pd(o, r, n),
                            a.head.appendChild(o);
                          break;
                        default:
                          throw Error(i(468, r));
                      }
                      (o[ht] = e), Ot(o), (r = o);
                    }
                    e.stateNode = r;
                  } else Hf(a, e.type, e.stateNode);
                else e.stateNode = If(a, r, e.memoizedProps);
              else
                o === r
                  ? r === null &&
                    e.stateNode !== null &&
                    Xc(e, e.memoizedProps, n.memoizedProps)
                  : (o === null
                      ? n.stateNode !== null &&
                        ((n = n.stateNode), n.parentNode.removeChild(n))
                      : o.count--,
                    r === null
                      ? Hf(a, e.type, e.stateNode)
                      : If(a, r, e.memoizedProps));
            }
            break;
          }
          case 27:
            gl(t, e),
              yl(e),
              r & 512 && (U || n === null || Jc(n, n.return)),
              n !== null && r & 4 && Xc(e, e.memoizedProps, n.memoizedProps);
            break;
          case 5:
            if (
              (gl(t, e),
              yl(e),
              r & 512 && (U || n === null || Jc(n, n.return)),
              e.flags & 32)
            ) {
              a = e.stateNode;
              try {
                $t(a, ``);
              } catch (t) {
                Z(e, e.return, t);
              }
            }
            r & 4 &&
              e.stateNode != null &&
              ((a = e.memoizedProps),
              Xc(e, a, n === null ? a : n.memoizedProps)),
              r & 1024 && (rl = !0);
            break;
          case 6:
            if ((gl(t, e), yl(e), r & 4)) {
              if (e.stateNode === null) throw Error(i(162));
              (r = e.memoizedProps), (n = e.stateNode);
              try {
                n.nodeValue = r;
              } catch (t) {
                Z(e, e.return, t);
              }
            }
            break;
          case 3:
            if (
              ((Bf = null),
              (a = _l),
              (_l = gf(t.containerInfo)),
              gl(t, e),
              (_l = a),
              yl(e),
              r & 4 && n !== null && n.memoizedState.isDehydrated)
            )
              try {
                Np(t.containerInfo);
              } catch (t) {
                Z(e, e.return, t);
              }
            rl && ((rl = !1), G(e));
            break;
          case 4:
            (r = _l),
              (_l = gf(e.stateNode.containerInfo)),
              gl(t, e),
              yl(e),
              (_l = r);
            break;
          case 12:
            gl(t, e), yl(e);
            break;
          case 31:
            gl(t, e),
              yl(e),
              r & 4 &&
                ((r = e.updateQueue),
                r !== null && ((e.updateQueue = null), hl(e, r)));
            break;
          case 13:
            gl(t, e),
              yl(e),
              e.child.flags & 8192 &&
                (e.memoizedState !== null) !=
                  (n !== null && n.memoizedState !== null) &&
                ($l = Pe()),
              r & 4 &&
                ((r = e.updateQueue),
                r !== null && ((e.updateQueue = null), hl(e, r)));
            break;
          case 22: {
            a = e.memoizedState !== null;
            var l = n !== null && n.memoizedState !== null,
              u = nl,
              d = U;
            if (
              ((nl = u || a),
              (U = d || l),
              gl(t, e),
              (U = d),
              (nl = u),
              yl(e),
              r & 8192)
            )
              a: for (
                t = e.stateNode,
                  t._visibility = a ? t._visibility & -2 : t._visibility | 1,
                  a && (n === null || l || nl || U || xl(e)),
                  n = null,
                  t = e;
                ;
              ) {
                if (t.tag === 5 || t.tag === 26) {
                  if (n === null) {
                    l = n = t;
                    try {
                      if (((o = l.stateNode), a))
                        (s = o.style),
                          typeof s.setProperty == `function`
                            ? s.setProperty(`display`, `none`, `important`)
                            : (s.display = `none`);
                      else {
                        c = l.stateNode;
                        var f = l.memoizedProps.style,
                          p =
                            f != null && Object.hasOwn(f, `display`)
                              ? f.display
                              : null;
                        c.style.display =
                          p == null || typeof p == `boolean`
                            ? ``
                            : (`` + p).trim();
                      }
                    } catch (e) {
                      Z(l, l.return, e);
                    }
                  }
                } else if (t.tag === 6) {
                  if (n === null) {
                    l = t;
                    try {
                      l.stateNode.nodeValue = a ? `` : l.memoizedProps;
                    } catch (e) {
                      Z(l, l.return, e);
                    }
                  }
                } else if (t.tag === 18) {
                  if (n === null) {
                    l = t;
                    try {
                      var m = l.stateNode;
                      a ? $d(m, !0) : $d(l.stateNode, !1);
                    } catch (e) {
                      Z(l, l.return, e);
                    }
                  }
                } else if (
                  ((t.tag !== 22 && t.tag !== 23) ||
                    t.memoizedState === null ||
                    t === e) &&
                  t.child !== null
                ) {
                  (t.child.return = t), (t = t.child);
                  continue;
                }
                if (t === e) break;
                for (; t.sibling === null; ) {
                  if (t.return === null || t.return === e) break a;
                  n === t && (n = null), (t = t.return);
                }
                n === t && (n = null),
                  (t.sibling.return = t.return),
                  (t = t.sibling);
              }
            r & 4 &&
              ((r = e.updateQueue),
              r !== null &&
                ((n = r.retryQueue),
                n !== null && ((r.retryQueue = null), hl(e, n))));
            break;
          }
          case 19:
            gl(t, e),
              yl(e),
              r & 4 &&
                ((r = e.updateQueue),
                r !== null && ((e.updateQueue = null), hl(e, r)));
            break;
          case 30:
            break;
          case 21:
            break;
          default:
            gl(t, e), yl(e);
        }
      }
      function yl(e) {
        var t = e.flags;
        if (t & 2) {
          try {
            for (var n, r = e.return; r !== null; ) {
              if (Zc(r)) {
                n = r;
                break;
              }
              r = r.return;
            }
            if (n == null) throw Error(i(160));
            switch (n.tag) {
              case 27: {
                var a = n.stateNode;
                el(e, Qc(e), a);
                break;
              }
              case 5: {
                var o = n.stateNode;
                n.flags & 32 && ($t(o, ``), (n.flags &= -33)), el(e, Qc(e), o);
                break;
              }
              case 3:
              case 4: {
                var s = n.stateNode.containerInfo;
                $c(e, Qc(e), s);
                break;
              }
              default:
                throw Error(i(161));
            }
          } catch (t) {
            Z(e, e.return, t);
          }
          e.flags &= -3;
        }
        t & 4096 && (e.flags &= -4097);
      }
      function G(e) {
        if (e.subtreeFlags & 1024)
          for (e = e.child; e !== null; ) {
            var t = e;
            G(t),
              t.tag === 5 && t.flags & 1024 && t.stateNode.reset(),
              (e = e.sibling);
          }
      }
      function bl(e, t) {
        if (t.subtreeFlags & 8772)
          for (t = t.child; t !== null; )
            sl(e, t.alternate, t), (t = t.sibling);
      }
      function xl(e) {
        for (e = e.child; e !== null; ) {
          var t = e;
          switch (t.tag) {
            case 0:
            case 11:
            case 14:
            case 15:
              Wc(4, t, t.return), xl(t);
              break;
            case 1: {
              Jc(t, t.return);
              var n = t.stateNode;
              typeof n.componentWillUnmount == `function` && Kc(t, t.return, n),
                xl(t);
              break;
            }
            case 27:
              pf(t.stateNode);
            case 26:
            case 5:
              Jc(t, t.return), xl(t);
              break;
            case 22:
              t.memoizedState === null && xl(t);
              break;
            case 30:
              xl(t);
              break;
            default:
              xl(t);
          }
          e = e.sibling;
        }
      }
      function Sl(e, t, n) {
        for (n &&= (t.subtreeFlags & 8772) != 0, t = t.child; t !== null; ) {
          var r = t.alternate,
            i = e,
            a = t,
            o = a.flags;
          switch (a.tag) {
            case 0:
            case 11:
            case 15:
              Sl(i, a, n), Uc(4, a);
              break;
            case 1:
              if (
                (Sl(i, a, n),
                (r = a),
                (i = r.stateNode),
                typeof i.componentDidMount == `function`)
              )
                try {
                  i.componentDidMount();
                } catch (e) {
                  Z(r, r.return, e);
                }
              if (((r = a), (i = r.updateQueue), i !== null)) {
                var s = r.stateNode;
                try {
                  var c = i.shared.hiddenCallbacks;
                  if (c !== null)
                    for (
                      i.shared.hiddenCallbacks = null, i = 0;
                      i < c.length;
                      i++
                    )
                      $a(c[i], s);
                } catch (e) {
                  Z(r, r.return, e);
                }
              }
              n && o & 64 && Gc(a), qc(a, a.return);
              break;
            case 27:
              tl(a);
            case 26:
            case 5:
              Sl(i, a, n), n && r === null && o & 4 && Yc(a), qc(a, a.return);
              break;
            case 12:
              Sl(i, a, n);
              break;
            case 31:
              Sl(i, a, n), n && o & 4 && fl(i, a);
              break;
            case 13:
              Sl(i, a, n), n && o & 4 && pl(i, a);
              break;
            case 22:
              a.memoizedState === null && Sl(i, a, n), qc(a, a.return);
              break;
            case 30:
              break;
            default:
              Sl(i, a, n);
          }
          t = t.sibling;
        }
      }
      function Cl(e, t) {
        var n = null;
        e !== null &&
          e.memoizedState !== null &&
          e.memoizedState.cachePool !== null &&
          (n = e.memoizedState.cachePool.pool),
          (e = null),
          t.memoizedState !== null &&
            t.memoizedState.cachePool !== null &&
            (e = t.memoizedState.cachePool.pool),
          e !== n && (e != null && e.refCount++, n != null && fa(n));
      }
      function wl(e, t) {
        (e = null),
          t.alternate !== null && (e = t.alternate.memoizedState.cache),
          (t = t.memoizedState.cache),
          t !== e && (t.refCount++, e != null && fa(e));
      }
      function Tl(e, t, n, r) {
        if (t.subtreeFlags & 10256)
          for (t = t.child; t !== null; ) El(e, t, n, r), (t = t.sibling);
      }
      function El(e, t, n, r) {
        var i = t.flags;
        switch (t.tag) {
          case 0:
          case 11:
          case 15:
            Tl(e, t, n, r), i & 2048 && Uc(9, t);
            break;
          case 1:
            Tl(e, t, n, r);
            break;
          case 3:
            Tl(e, t, n, r),
              i & 2048 &&
                ((e = null),
                t.alternate !== null && (e = t.alternate.memoizedState.cache),
                (t = t.memoizedState.cache),
                t !== e && (t.refCount++, e != null && fa(e)));
            break;
          case 12:
            if (i & 2048) {
              Tl(e, t, n, r), (e = t.stateNode);
              try {
                var a = t.memoizedProps,
                  o = a.id,
                  s = a.onPostCommit;
                typeof s == `function` &&
                  s(
                    o,
                    t.alternate === null ? `mount` : `update`,
                    e.passiveEffectDuration,
                    -0,
                  );
              } catch (e) {
                Z(t, t.return, e);
              }
            } else Tl(e, t, n, r);
            break;
          case 31:
            Tl(e, t, n, r);
            break;
          case 13:
            Tl(e, t, n, r);
            break;
          case 23:
            break;
          case 22:
            (a = t.stateNode),
              (o = t.alternate),
              t.memoizedState === null
                ? a._visibility & 2
                  ? Tl(e, t, n, r)
                  : ((a._visibility |= 2),
                    Dl(e, t, n, r, (t.subtreeFlags & 10256) != 0 || !1))
                : a._visibility & 2
                  ? Tl(e, t, n, r)
                  : Ol(e, t),
              i & 2048 && Cl(o, t);
            break;
          case 24:
            Tl(e, t, n, r), i & 2048 && wl(t.alternate, t);
            break;
          default:
            Tl(e, t, n, r);
        }
      }
      function Dl(e, t, n, r, i) {
        for (
          i &&= (t.subtreeFlags & 10256) != 0 || !1, t = t.child;
          t !== null;
        ) {
          var a = e,
            o = t,
            s = n,
            c = r,
            l = o.flags;
          switch (o.tag) {
            case 0:
            case 11:
            case 15:
              Dl(a, o, s, c, i), Uc(8, o);
              break;
            case 23:
              break;
            case 22: {
              var u = o.stateNode;
              o.memoizedState === null
                ? ((u._visibility |= 2), Dl(a, o, s, c, i))
                : u._visibility & 2
                  ? Dl(a, o, s, c, i)
                  : Ol(a, o),
                i && l & 2048 && Cl(o.alternate, o);
              break;
            }
            case 24:
              Dl(a, o, s, c, i), i && l & 2048 && wl(o.alternate, o);
              break;
            default:
              Dl(a, o, s, c, i);
          }
          t = t.sibling;
        }
      }
      function Ol(e, t) {
        if (t.subtreeFlags & 10256)
          for (t = t.child; t !== null; ) {
            var n = e,
              r = t,
              i = r.flags;
            switch (r.tag) {
              case 22:
                Ol(n, r), i & 2048 && Cl(r.alternate, r);
                break;
              case 24:
                Ol(n, r), i & 2048 && wl(r.alternate, r);
                break;
              default:
                Ol(n, r);
            }
            t = t.sibling;
          }
      }
      var kl = 8192;
      function Al(e, t, n) {
        if (e.subtreeFlags & kl)
          for (e = e.child; e !== null; ) jl(e, t, n), (e = e.sibling);
      }
      function jl(e, t, n) {
        switch (e.tag) {
          case 26:
            Al(e, t, n),
              e.flags & kl &&
                e.memoizedState !== null &&
                Gf(n, _l, e.memoizedState, e.memoizedProps);
            break;
          case 5:
            Al(e, t, n);
            break;
          case 3:
          case 4: {
            var r = _l;
            (_l = gf(e.stateNode.containerInfo)), Al(e, t, n), (_l = r);
            break;
          }
          case 22:
            e.memoizedState === null &&
              ((r = e.alternate),
              r !== null && r.memoizedState !== null
                ? ((r = kl), (kl = 16777216), Al(e, t, n), (kl = r))
                : Al(e, t, n));
            break;
          default:
            Al(e, t, n);
        }
      }
      function Ml(e) {
        var t = e.alternate;
        if (t !== null && ((e = t.child), e !== null)) {
          t.child = null;
          do (t = e.sibling), (e.sibling = null), (e = t);
          while (e !== null);
        }
      }
      function Nl(e) {
        var t = e.deletions;
        if (e.flags & 16) {
          if (t !== null)
            for (var n = 0; n < t.length; n++) {
              var r = t[n];
              (al = r), Il(r, e);
            }
          Ml(e);
        }
        if (e.subtreeFlags & 10256)
          for (e = e.child; e !== null; ) Pl(e), (e = e.sibling);
      }
      function Pl(e) {
        switch (e.tag) {
          case 0:
          case 11:
          case 15:
            Nl(e), e.flags & 2048 && Wc(9, e, e.return);
            break;
          case 3:
            Nl(e);
            break;
          case 12:
            Nl(e);
            break;
          case 22: {
            var t = e.stateNode;
            e.memoizedState !== null &&
            t._visibility & 2 &&
            (e.return === null || e.return.tag !== 13)
              ? ((t._visibility &= -3), Fl(e))
              : Nl(e);
            break;
          }
          default:
            Nl(e);
        }
      }
      function Fl(e) {
        var t = e.deletions;
        if (e.flags & 16) {
          if (t !== null)
            for (var n = 0; n < t.length; n++) {
              var r = t[n];
              (al = r), Il(r, e);
            }
          Ml(e);
        }
        for (e = e.child; e !== null; ) {
          switch (((t = e), t.tag)) {
            case 0:
            case 11:
            case 15:
              Wc(8, t, t.return), Fl(t);
              break;
            case 22:
              (n = t.stateNode),
                n._visibility & 2 && ((n._visibility &= -3), Fl(t));
              break;
            default:
              Fl(t);
          }
          e = e.sibling;
        }
      }
      function Il(e, t) {
        for (; al !== null; ) {
          var n = al;
          switch (n.tag) {
            case 0:
            case 11:
            case 15:
              Wc(8, n, t);
              break;
            case 23:
            case 22:
              if (
                n.memoizedState !== null &&
                n.memoizedState.cachePool !== null
              ) {
                var r = n.memoizedState.cachePool.pool;
                r != null && r.refCount++;
              }
              break;
            case 24:
              fa(n.memoizedState.cache);
          }
          if (((r = n.child), r !== null)) (r.return = n), (al = r);
          else
            for (n = e; al !== null; ) {
              r = al;
              var i = r.sibling,
                a = r.return;
              if ((cl(r), r === n)) {
                al = null;
                break;
              }
              if (i !== null) {
                (i.return = a), (al = i);
                break;
              }
              al = a;
            }
        }
      }
      var Ll = {
          getCacheForType: (e) => {
            var t = ia(ua),
              n = t.data.get(e);
            return n === void 0 && ((n = e()), t.data.set(e, n)), n;
          },
          cacheSignal: () => ia(ua).controller.signal,
        },
        Rl = typeof WeakMap == `function` ? WeakMap : Map,
        K = 0,
        q = null,
        J = null,
        Y = 0,
        X = 0,
        zl = null,
        Bl = !1,
        Vl = !1,
        Hl = !1,
        Ul = 0,
        Wl = 0,
        Gl = 0,
        Kl = 0,
        ql = 0,
        Jl = 0,
        Yl = 0,
        Xl = null,
        Zl = null,
        Ql = !1,
        $l = 0,
        eu = 0,
        tu = 1 / 0,
        nu = null,
        ru = null,
        iu = 0,
        au = null,
        ou = null,
        su = 0,
        cu = 0,
        lu = null,
        uu = null,
        du = 0,
        fu = null;
      function pu() {
        return K & 2 && Y !== 0 ? Y & -Y : T.T === null ? ft() : dd();
      }
      function mu() {
        if (Jl === 0)
          if (!(Y & 536870912) || I) {
            var e = Ze;
            (Ze <<= 1), !(Ze & 3932160) && (Ze = 262144), (Jl = e);
          } else Jl = 536870912;
        return (e = oo.current), e !== null && (e.flags |= 32), Jl;
      }
      function hu(e, t, n) {
        ((e === q && (X === 2 || X === 9)) || e.cancelPendingCommit !== null) &&
          (Su(e, 0), yu(e, Y, Jl, !1)),
          at(e, n),
          (!(K & 2) || e !== q) &&
            (e === q && (!(K & 2) && (Kl |= n), Wl === 4 && yu(e, Y, Jl, !1)),
            rd(e));
      }
      function gu(e, t, n) {
        if (K & 6) throw Error(i(327));
        var r =
            (!n && (t & 127) == 0 && (t & e.expiredLanes) === 0) || tt(e, t),
          a = r ? Au(e, t) : Ou(e, t, !0),
          o = r;
        do {
          if (a === 0) {
            Vl && !r && yu(e, t, 0, !1);
            break;
          } else {
            if (((n = e.current.alternate), o && !vu(n))) {
              (a = Ou(e, t, !1)), (o = !1);
              continue;
            }
            if (a === 2) {
              if (((o = t), e.errorRecoveryDisabledLanes & o)) var s = 0;
              else
                (s = e.pendingLanes & -536870913),
                  (s = s === 0 ? (s & 536870912 ? 536870912 : 0) : s);
              if (s !== 0) {
                t = s;
                a: {
                  var c = e;
                  a = Xl;
                  var l = c.current.memoizedState.isDehydrated;
                  if (
                    (l && (Su(c, s).flags |= 256), (s = Ou(c, s, !1)), s !== 2)
                  ) {
                    if (Hl && !l) {
                      (c.errorRecoveryDisabledLanes |= o), (Kl |= o), (a = 4);
                      break a;
                    }
                    (o = Zl),
                      (Zl = a),
                      o !== null &&
                        (Zl === null ? (Zl = o) : Zl.push.apply(Zl, o));
                  }
                  a = s;
                }
                if (((o = !1), a !== 2)) continue;
              }
            }
            if (a === 1) {
              Su(e, 0), yu(e, t, 0, !0);
              break;
            }
            a: {
              switch (((r = e), (o = a), o)) {
                case 0:
                case 1:
                  throw Error(i(345));
                case 4:
                  if ((t & 4194048) !== t) break;
                case 6:
                  yu(r, t, Jl, !Bl);
                  break a;
                case 2:
                  Zl = null;
                  break;
                case 3:
                case 5:
                  break;
                default:
                  throw Error(i(329));
              }
              if ((t & 62914560) === t && ((a = $l + 300 - Pe()), 10 < a)) {
                if ((yu(r, t, Jl, !Bl), et(r, 0, !0) !== 0)) break a;
                (su = t),
                  (r.timeoutHandle = Kd(
                    _u.bind(
                      null,
                      r,
                      n,
                      Zl,
                      nu,
                      Ql,
                      t,
                      Jl,
                      Kl,
                      Yl,
                      Bl,
                      o,
                      `Throttled`,
                      -0,
                      0,
                    ),
                    a,
                  ));
                break a;
              }
              _u(r, n, Zl, nu, Ql, t, Jl, Kl, Yl, Bl, o, null, -0, 0);
            }
          }
          break;
        } while (1);
        rd(e);
      }
      function _u(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
        if (
          ((e.timeoutHandle = -1),
          (d = t.subtreeFlags),
          d & 8192 || (d & 16785408) == 16785408)
        ) {
          (d = {
            stylesheets: null,
            count: 0,
            imgCount: 0,
            imgBytes: 0,
            suspenseyImages: [],
            waitingForImages: !0,
            waitingForViewTransition: !1,
            unsuspend: cn,
          }),
            jl(t, a, d);
          var m =
            (a & 62914560) === a
              ? $l - Pe()
              : (a & 4194048) === a
                ? eu - Pe()
                : 0;
          if (((m = qf(d, m)), m !== null)) {
            (su = a),
              (e.cancelPendingCommit = m(
                Lu.bind(null, e, t, a, n, r, i, o, s, c, u, d, null, f, p),
              )),
              yu(e, a, o, !l);
            return;
          }
        }
        Lu(e, t, a, n, r, i, o, s, c);
      }
      function vu(e) {
        for (var t = e; ; ) {
          var n = t.tag;
          if (
            (n === 0 || n === 11 || n === 15) &&
            t.flags & 16384 &&
            ((n = t.updateQueue), n !== null && ((n = n.stores), n !== null))
          )
            for (var r = 0; r < n.length; r++) {
              var i = n[r],
                a = i.getSnapshot;
              i = i.value;
              try {
                if (!Or(a(), i)) return !1;
              } catch {
                return !1;
              }
            }
          if (((n = t.child), t.subtreeFlags & 16384 && n !== null))
            (n.return = t), (t = n);
          else {
            if (t === e) break;
            for (; t.sibling === null; ) {
              if (t.return === null || t.return === e) return !0;
              t = t.return;
            }
            (t.sibling.return = t.return), (t = t.sibling);
          }
        }
        return !0;
      }
      function yu(e, t, n, r) {
        (t &= ~ql),
          (t &= ~Kl),
          (e.suspendedLanes |= t),
          (e.pingedLanes &= ~t),
          r && (e.warmLanes |= t),
          (r = e.expirationTimes);
        for (var i = t; 0 < i; ) {
          var a = 31 - Ke(i),
            o = 1 << a;
          (r[a] = -1), (i &= ~o);
        }
        n !== 0 && st(e, n, t);
      }
      function bu() {
        return K & 6 ? !0 : (id(0, !1), !1);
      }
      function xu() {
        if (J !== null) {
          if (X === 0) var e = J.return;
          else (e = J), (Xi = Yi = null), No(e), (Fa = null), (Ia = 0), (e = J);
          for (; e !== null; ) Hc(e.alternate, e), (e = e.return);
          J = null;
        }
      }
      function Su(e, t) {
        var n = e.timeoutHandle;
        n !== -1 && ((e.timeoutHandle = -1), qd(n)),
          (n = e.cancelPendingCommit),
          n !== null && ((e.cancelPendingCommit = null), n()),
          (su = 0),
          xu(),
          (q = e),
          (J = n = mi(e.current, null)),
          (Y = t),
          (X = 0),
          (zl = null),
          (Bl = !1),
          (Vl = tt(e, t)),
          (Hl = !1),
          (Yl = Jl = ql = Kl = Gl = Wl = 0),
          (Zl = Xl = null),
          (Ql = !1),
          t & 8 && (t |= t & 32);
        var r = e.entangledLanes;
        if (r !== 0)
          for (e = e.entanglements, r &= t; 0 < r; ) {
            var i = 31 - Ke(r),
              a = 1 << i;
            (t |= e[i]), (r &= ~a);
          }
        return (Ul = t), ii(), n;
      }
      function Cu(e, t) {
        (L = null),
          (T.H = Vs),
          t === Ta || t === Da
            ? ((t = Na()), (X = 3))
            : t === Ea
              ? ((t = Na()), (X = 4))
              : (X =
                  t === ac
                    ? 8
                    : typeof t == `object` && t && typeof t.then == `function`
                      ? 6
                      : 1),
          (zl = t),
          J === null && ((Wl = 1), $s(e, Si(t, e.current)));
      }
      function wu() {
        var e = oo.current;
        return e === null
          ? !0
          : (Y & 4194048) === Y
            ? so === null
            : (Y & 62914560) === Y || Y & 536870912
              ? e === so
              : !1;
      }
      function Tu() {
        var e = T.H;
        return (T.H = Vs), e === null ? Vs : e;
      }
      function Eu() {
        var e = T.A;
        return (T.A = Ll), e;
      }
      function Du() {
        (Wl = 4),
          Bl || ((Y & 4194048) !== Y && oo.current !== null) || (Vl = !0),
          (!(Gl & 134217727) && !(Kl & 134217727)) ||
            q === null ||
            yu(q, Y, Jl, !1);
      }
      function Ou(e, t, n) {
        var r = K;
        K |= 2;
        var i = Tu(),
          a = Eu();
        (q !== e || Y !== t) && ((nu = null), Su(e, t)), (t = !1);
        var o = Wl;
        a: do
          try {
            if (X !== 0 && J !== null) {
              var s = J,
                c = zl;
              switch (X) {
                case 8:
                  xu(), (o = 6);
                  break a;
                case 3:
                case 2:
                case 9:
                case 6: {
                  oo.current === null && (t = !0);
                  var l = X;
                  if (((X = 0), (zl = null), Pu(e, s, c, l), n && Vl)) {
                    o = 0;
                    break a;
                  }
                  break;
                }
                default:
                  (l = X), (X = 0), (zl = null), Pu(e, s, c, l);
              }
            }
            ku(), (o = Wl);
            break;
          } catch (t) {
            Cu(e, t);
          }
        while (1);
        return (
          t && e.shellSuspendCounter++,
          (Xi = Yi = null),
          (K = r),
          (T.H = i),
          (T.A = a),
          J === null && ((q = null), (Y = 0), ii()),
          o
        );
      }
      function ku() {
        for (; J !== null; ) Mu(J);
      }
      function Au(e, t) {
        var n = K;
        K |= 2;
        var r = Tu(),
          a = Eu();
        q !== e || Y !== t
          ? ((nu = null), (tu = Pe() + 500), Su(e, t))
          : (Vl = tt(e, t));
        a: do
          try {
            if (X !== 0 && J !== null) {
              t = J;
              var o = zl;
              b: switch (X) {
                case 1:
                  (X = 0), (zl = null), Pu(e, t, o, 1);
                  break;
                case 2:
                case 9:
                  if (ka(o)) {
                    (X = 0), (zl = null), Nu(t);
                    break;
                  }
                  (t = () => {
                    (X !== 2 && X !== 9) || q !== e || (X = 7), rd(e);
                  }),
                    o.then(t, t);
                  break a;
                case 3:
                  X = 7;
                  break a;
                case 4:
                  X = 5;
                  break a;
                case 7:
                  ka(o)
                    ? ((X = 0), (zl = null), Nu(t))
                    : ((X = 0), (zl = null), Pu(e, t, o, 7));
                  break;
                case 5: {
                  var s = null;
                  switch (J.tag) {
                    case 26:
                      s = J.memoizedState;
                    case 5:
                    case 27: {
                      var c = J;
                      if (s ? Wf(s) : c.stateNode.complete) {
                        (X = 0), (zl = null);
                        var l = c.sibling;
                        if (l !== null) J = l;
                        else {
                          var u = c.return;
                          u === null ? (J = null) : ((J = u), Fu(u));
                        }
                        break b;
                      }
                    }
                  }
                  (X = 0), (zl = null), Pu(e, t, o, 5);
                  break;
                }
                case 6:
                  (X = 0), (zl = null), Pu(e, t, o, 6);
                  break;
                case 8:
                  xu(), (Wl = 6);
                  break a;
                default:
                  throw Error(i(462));
              }
            }
            ju();
            break;
          } catch (t) {
            Cu(e, t);
          }
        while (1);
        return (
          (Xi = Yi = null),
          (T.H = r),
          (T.A = a),
          (K = n),
          J === null ? ((q = null), (Y = 0), ii(), Wl) : 0
        );
      }
      function ju() {
        for (; J !== null && !Me(); ) Mu(J);
      }
      function Mu(e) {
        var t = Pc(e.alternate, e, Ul);
        (e.memoizedProps = e.pendingProps), t === null ? Fu(e) : (J = t);
      }
      function Nu(e) {
        var t = e,
          n = t.alternate;
        switch (t.tag) {
          case 15:
          case 0:
            t = vc(n, t, t.pendingProps, t.type, void 0, Y);
            break;
          case 11:
            t = vc(n, t, t.pendingProps, t.type.render, t.ref, Y);
            break;
          case 5:
            No(t);
          default:
            Hc(n, t), (t = J = hi(t, Ul)), (t = Pc(n, t, Ul));
        }
        (e.memoizedProps = e.pendingProps), t === null ? Fu(e) : (J = t);
      }
      function Pu(e, t, n, r) {
        (Xi = Yi = null), No(t), (Fa = null), (Ia = 0);
        var i = t.return;
        try {
          if (ic(e, i, t, n, Y)) {
            (Wl = 1), $s(e, Si(n, e.current)), (J = null);
            return;
          }
        } catch (t) {
          if (i !== null) throw ((J = i), t);
          (Wl = 1), $s(e, Si(n, e.current)), (J = null);
          return;
        }
        t.flags & 32768
          ? (I || r === 1
              ? (e = !0)
              : Vl || Y & 536870912
                ? (e = !1)
                : ((Bl = e = !0),
                  (r === 2 || r === 9 || r === 3 || r === 6) &&
                    ((r = oo.current),
                    r !== null && r.tag === 13 && (r.flags |= 16384))),
            Iu(t, e))
          : Fu(t);
      }
      function Fu(e) {
        var t = e;
        do {
          if (t.flags & 32768) {
            Iu(t, Bl);
            return;
          }
          e = t.return;
          var n = Bc(t.alternate, t, Ul);
          if (n !== null) {
            J = n;
            return;
          }
          if (((t = t.sibling), t !== null)) {
            J = t;
            return;
          }
          J = t = e;
        } while (t !== null);
        Wl === 0 && (Wl = 5);
      }
      function Iu(e, t) {
        do {
          var n = Vc(e.alternate, e);
          if (n !== null) {
            (n.flags &= 32767), (J = n);
            return;
          }
          if (
            ((n = e.return),
            n !== null &&
              ((n.flags |= 32768), (n.subtreeFlags = 0), (n.deletions = null)),
            !t && ((e = e.sibling), e !== null))
          ) {
            J = e;
            return;
          }
          J = e = n;
        } while (e !== null);
        (Wl = 6), (J = null);
      }
      function Lu(e, t, n, r, a, o, s, c, l) {
        e.cancelPendingCommit = null;
        do Hu();
        while (iu !== 0);
        if (K & 6) throw Error(i(327));
        if (t !== null) {
          if (t === e.current) throw Error(i(177));
          if (
            ((o = t.lanes | t.childLanes),
            (o |= ri),
            ot(e, n, o, s, c, l),
            e === q && ((J = q = null), (Y = 0)),
            (ou = t),
            (au = e),
            (su = n),
            (cu = o),
            (lu = a),
            (uu = r),
            t.subtreeFlags & 10256 || t.flags & 10256
              ? ((e.callbackNode = null),
                (e.callbackPriority = 0),
                Xu(Re, () => (Uu(), null)))
              : ((e.callbackNode = null), (e.callbackPriority = 0)),
            (r = (t.flags & 13878) != 0),
            t.subtreeFlags & 13878 || r)
          ) {
            (r = T.T), (T.T = null), (a = E.p), (E.p = 2), (s = K), (K |= 4);
            try {
              ol(e, t, n);
            } finally {
              (K = s), (E.p = a), (T.T = r);
            }
          }
          (iu = 1), Ru(), zu(), Bu();
        }
      }
      function Ru() {
        if (iu === 1) {
          iu = 0;
          var e = au,
            t = ou,
            n = (t.flags & 13878) != 0;
          if (t.subtreeFlags & 13878 || n) {
            (n = T.T), (T.T = null);
            var r = E.p;
            E.p = 2;
            var i = K;
            K |= 4;
            try {
              vl(t, e);
              var a = zd,
                o = Nr(e.containerInfo),
                s = a.focusedElem,
                c = a.selectionRange;
              if (
                o !== s &&
                s &&
                s.ownerDocument &&
                Mr(s.ownerDocument.documentElement, s)
              ) {
                if (c !== null && Pr(s)) {
                  var l = c.start,
                    u = c.end;
                  if ((u === void 0 && (u = l), `selectionStart` in s))
                    (s.selectionStart = l),
                      (s.selectionEnd = Math.min(u, s.value.length));
                  else {
                    var d = s.ownerDocument || document,
                      f = (d && d.defaultView) || window;
                    if (f.getSelection) {
                      var p = f.getSelection(),
                        m = s.textContent.length,
                        h = Math.min(c.start, m),
                        g = c.end === void 0 ? h : Math.min(c.end, m);
                      !p.extend && h > g && ((o = g), (g = h), (h = o));
                      var _ = jr(s, h),
                        v = jr(s, g);
                      if (
                        _ &&
                        v &&
                        (p.rangeCount !== 1 ||
                          p.anchorNode !== _.node ||
                          p.anchorOffset !== _.offset ||
                          p.focusNode !== v.node ||
                          p.focusOffset !== v.offset)
                      ) {
                        var y = d.createRange();
                        y.setStart(_.node, _.offset),
                          p.removeAllRanges(),
                          h > g
                            ? (p.addRange(y), p.extend(v.node, v.offset))
                            : (y.setEnd(v.node, v.offset), p.addRange(y));
                      }
                    }
                  }
                }
                for (d = [], p = s; (p = p.parentNode); )
                  p.nodeType === 1 &&
                    d.push({
                      element: p,
                      left: p.scrollLeft,
                      top: p.scrollTop,
                    });
                for (
                  typeof s.focus == `function` && s.focus(), s = 0;
                  s < d.length;
                  s++
                ) {
                  var b = d[s];
                  (b.element.scrollLeft = b.left),
                    (b.element.scrollTop = b.top);
                }
              }
              (sp = !!Rd), (zd = Rd = null);
            } finally {
              (K = i), (E.p = r), (T.T = n);
            }
          }
          (e.current = t), (iu = 2);
        }
      }
      function zu() {
        if (iu === 2) {
          iu = 0;
          var e = au,
            t = ou,
            n = (t.flags & 8772) != 0;
          if (t.subtreeFlags & 8772 || n) {
            (n = T.T), (T.T = null);
            var r = E.p;
            E.p = 2;
            var i = K;
            K |= 4;
            try {
              sl(e, t.alternate, t);
            } finally {
              (K = i), (E.p = r), (T.T = n);
            }
          }
          iu = 3;
        }
      }
      function Bu() {
        if (iu === 4 || iu === 3) {
          (iu = 0), Ne();
          var e = au,
            t = ou,
            n = su,
            r = uu;
          t.subtreeFlags & 10256 || t.flags & 10256
            ? (iu = 5)
            : ((iu = 0), (ou = au = null), Vu(e, e.pendingLanes));
          var i = e.pendingLanes;
          if (
            (i === 0 && (ru = null),
            dt(n),
            (t = t.stateNode),
            We && typeof We.onCommitFiberRoot == `function`)
          )
            try {
              We.onCommitFiberRoot(
                Ue,
                t,
                void 0,
                (t.current.flags & 128) == 128,
              );
            } catch {}
          if (r !== null) {
            (t = T.T), (i = E.p), (E.p = 2), (T.T = null);
            try {
              for (var a = e.onRecoverableError, o = 0; o < r.length; o++) {
                var s = r[o];
                a(s.value, { componentStack: s.stack });
              }
            } finally {
              (T.T = t), (E.p = i);
            }
          }
          su & 3 && Hu(),
            rd(e),
            (i = e.pendingLanes),
            n & 261930 && i & 42
              ? e === fu
                ? du++
                : ((du = 0), (fu = e))
              : (du = 0),
            id(0, !1);
        }
      }
      function Vu(e, t) {
        (e.pooledCacheLanes &= t) === 0 &&
          ((t = e.pooledCache), t != null && ((e.pooledCache = null), fa(t)));
      }
      function Hu() {
        return Ru(), zu(), Bu(), Uu();
      }
      function Uu() {
        if (iu !== 5) return !1;
        var e = au,
          t = cu;
        cu = 0;
        var n = dt(su),
          r = T.T,
          a = E.p;
        try {
          (E.p = 32 > n ? 32 : n), (T.T = null), (n = lu), (lu = null);
          var o = au,
            s = su;
          if (((iu = 0), (ou = au = null), (su = 0), K & 6))
            throw Error(i(331));
          var c = K;
          if (
            ((K |= 4),
            Pl(o.current),
            El(o, o.current, s, n),
            (K = c),
            id(0, !1),
            We && typeof We.onPostCommitFiberRoot == `function`)
          )
            try {
              We.onPostCommitFiberRoot(Ue, o);
            } catch {}
          return !0;
        } finally {
          (E.p = a), (T.T = r), Vu(e, t);
        }
      }
      function Wu(e, t, n) {
        (t = Si(n, t)),
          (t = tc(e.stateNode, t, 2)),
          (e = qa(e, t, 2)),
          e !== null && (at(e, 2), rd(e));
      }
      function Z(e, t, n) {
        if (e.tag === 3) Wu(e, e, n);
        else
          for (; t !== null; ) {
            if (t.tag === 3) {
              Wu(t, e, n);
              break;
            } else if (t.tag === 1) {
              var r = t.stateNode;
              if (
                typeof t.type.getDerivedStateFromError == `function` ||
                (typeof r.componentDidCatch == `function` &&
                  (ru === null || !ru.has(r)))
              ) {
                (e = Si(n, e)),
                  (n = nc(2)),
                  (r = qa(t, n, 2)),
                  r !== null && (rc(n, r, t, e), at(r, 2), rd(r));
                break;
              }
            }
            t = t.return;
          }
      }
      function Gu(e, t, n) {
        var r = e.pingCache;
        if (r === null) {
          r = e.pingCache = new Rl();
          var i = new Set();
          r.set(t, i);
        } else (i = r.get(t)), i === void 0 && ((i = new Set()), r.set(t, i));
        i.has(n) ||
          ((Hl = !0), i.add(n), (e = Ku.bind(null, e, t, n)), t.then(e, e));
      }
      function Ku(e, t, n) {
        var r = e.pingCache;
        r !== null && r.delete(t),
          (e.pingedLanes |= e.suspendedLanes & n),
          (e.warmLanes &= ~n),
          q === e &&
            (Y & n) === n &&
            (Wl === 4 || (Wl === 3 && (Y & 62914560) === Y && 300 > Pe() - $l)
              ? !(K & 2) && Su(e, 0)
              : (ql |= n),
            Yl === Y && (Yl = 0)),
          rd(e);
      }
      function qu(e, t) {
        t === 0 && (t = rt()), (e = si(e, t)), e !== null && (at(e, t), rd(e));
      }
      function Ju(e) {
        var t = e.memoizedState,
          n = 0;
        t !== null && (n = t.retryLane), qu(e, n);
      }
      function Yu(e, t) {
        var n = 0;
        switch (e.tag) {
          case 31:
          case 13: {
            var r = e.stateNode,
              a = e.memoizedState;
            a !== null && (n = a.retryLane);
            break;
          }
          case 19:
            r = e.stateNode;
            break;
          case 22:
            r = e.stateNode._retryCache;
            break;
          default:
            throw Error(i(314));
        }
        r !== null && r.delete(t), qu(e, n);
      }
      function Xu(e, t) {
        return Ae(e, t);
      }
      var Zu = null,
        Qu = null,
        $u = !1,
        ed = !1,
        td = !1,
        nd = 0;
      function rd(e) {
        e !== Qu &&
          e.next === null &&
          (Qu === null ? (Zu = Qu = e) : (Qu = Qu.next = e)),
          (ed = !0),
          $u || (($u = !0), ud());
      }
      function id(e, t) {
        if (!td && ed) {
          td = !0;
          do
            for (var n = !1, r = Zu; r !== null; ) {
              if (!t)
                if (e !== 0) {
                  var i = r.pendingLanes;
                  if (i === 0) var a = 0;
                  else {
                    var o = r.suspendedLanes,
                      s = r.pingedLanes;
                    (a = (1 << (31 - Ke(42 | e) + 1)) - 1),
                      (a &= i & ~(o & ~s)),
                      (a = a & 201326741 ? (a & 201326741) | 1 : a ? a | 2 : 0);
                  }
                  a !== 0 && ((n = !0), ld(r, a));
                } else
                  (a = Y),
                    (a = et(
                      r,
                      r === q ? a : 0,
                      r.cancelPendingCommit !== null || r.timeoutHandle !== -1,
                    )),
                    !(a & 3) || tt(r, a) || ((n = !0), ld(r, a));
              r = r.next;
            }
          while (n);
          td = !1;
        }
      }
      function ad() {
        od();
      }
      function od() {
        ed = $u = !1;
        var e = 0;
        nd !== 0 && Gd() && (e = nd);
        for (var t = Pe(), n = null, r = Zu; r !== null; ) {
          var i = r.next,
            a = sd(r, t);
          a === 0
            ? ((r.next = null),
              n === null ? (Zu = i) : (n.next = i),
              i === null && (Qu = n))
            : ((n = r), (e !== 0 || a & 3) && (ed = !0)),
            (r = i);
        }
        (iu !== 0 && iu !== 5) || id(e, !1), nd !== 0 && (nd = 0);
      }
      function sd(e, t) {
        for (
          var n = e.suspendedLanes,
            r = e.pingedLanes,
            i = e.expirationTimes,
            a = e.pendingLanes & -62914561;
          0 < a;
        ) {
          var o = 31 - Ke(a),
            s = 1 << o,
            c = i[o];
          c === -1
            ? ((s & n) === 0 || (s & r) !== 0) && (i[o] = nt(s, t))
            : c <= t && (e.expiredLanes |= s),
            (a &= ~s);
        }
        if (
          ((t = q),
          (n = Y),
          (n = et(
            e,
            e === t ? n : 0,
            e.cancelPendingCommit !== null || e.timeoutHandle !== -1,
          )),
          (r = e.callbackNode),
          n === 0 ||
            (e === t && (X === 2 || X === 9)) ||
            e.cancelPendingCommit !== null)
        )
          return (
            r !== null && r !== null && je(r),
            (e.callbackNode = null),
            (e.callbackPriority = 0)
          );
        if (!(n & 3) || tt(e, n)) {
          if (((t = n & -n), t === e.callbackPriority)) return t;
          switch ((r !== null && je(r), dt(n))) {
            case 2:
            case 8:
              n = Le;
              break;
            case 32:
              n = Re;
              break;
            case 268435456:
              n = Be;
              break;
            default:
              n = Re;
          }
          return (
            (r = cd.bind(null, e)),
            (n = Ae(n, r)),
            (e.callbackPriority = t),
            (e.callbackNode = n),
            t
          );
        }
        return (
          r !== null && r !== null && je(r),
          (e.callbackPriority = 2),
          (e.callbackNode = null),
          2
        );
      }
      function cd(e, t) {
        if (iu !== 0 && iu !== 5)
          return (e.callbackNode = null), (e.callbackPriority = 0), null;
        var n = e.callbackNode;
        if (Hu() && e.callbackNode !== n) return null;
        var r = Y;
        return (
          (r = et(
            e,
            e === q ? r : 0,
            e.cancelPendingCommit !== null || e.timeoutHandle !== -1,
          )),
          r === 0
            ? null
            : (gu(e, r, t),
              sd(e, Pe()),
              e.callbackNode != null && e.callbackNode === n
                ? cd.bind(null, e)
                : null)
        );
      }
      function ld(e, t) {
        if (Hu()) return null;
        gu(e, t, !0);
      }
      function ud() {
        Yd(() => {
          K & 6 ? Ae(Ie, ad) : od();
        });
      }
      function dd() {
        if (nd === 0) {
          var e = ha;
          e === 0 && ((e = Xe), (Xe <<= 1), !(Xe & 261888) && (Xe = 256)),
            (nd = e);
        }
        return nd;
      }
      function fd(e) {
        return e == null || typeof e == `symbol` || typeof e == `boolean`
          ? null
          : typeof e == `function`
            ? e
            : sn(`` + e);
      }
      function pd(e, t) {
        var n = t.ownerDocument.createElement(`input`);
        return (
          (n.name = t.name),
          (n.value = t.value),
          e.id && n.setAttribute(`form`, e.id),
          t.parentNode.insertBefore(n, t),
          (e = new FormData(e)),
          n.parentNode.removeChild(n),
          e
        );
      }
      function md(e, t, n, r, i) {
        if (t === `submit` && n && n.stateNode === i) {
          var a = fd((i[gt] || null).action),
            o = r.submitter;
          o &&
            ((t = (t = o[gt] || null)
              ? fd(t.formAction)
              : o.getAttribute(`formAction`)),
            t !== null && ((a = t), (o = null)));
          var s = new Dn(`action`, `action`, null, r, i);
          e.push({
            event: s,
            listeners: [
              {
                instance: null,
                listener: () => {
                  if (r.defaultPrevented) {
                    if (nd !== 0) {
                      var e = o ? pd(i, o) : new FormData(i);
                      Os(
                        n,
                        { pending: !0, data: e, method: i.method, action: a },
                        null,
                        e,
                      );
                    }
                  } else
                    typeof a == `function` &&
                      (s.preventDefault(),
                      (e = o ? pd(i, o) : new FormData(i)),
                      Os(
                        n,
                        { pending: !0, data: e, method: i.method, action: a },
                        a,
                        e,
                      ));
                },
                currentTarget: i,
              },
            ],
          });
        }
      }
      for (var hd = 0; hd < ei.length; hd++) {
        var gd = ei[hd];
        N(gd.toLowerCase(), `on` + (gd[0].toUpperCase() + gd.slice(1)));
      }
      N(Kr, `onAnimationEnd`),
        N(qr, `onAnimationIteration`),
        N(Jr, `onAnimationStart`),
        N(`dblclick`, `onDoubleClick`),
        N(`focusin`, `onFocus`),
        N(`focusout`, `onBlur`),
        N(Yr, `onTransitionRun`),
        N(Xr, `onTransitionStart`),
        N(Zr, `onTransitionCancel`),
        N(Qr, `onTransitionEnd`),
        Mt(`onMouseEnter`, [`mouseout`, `mouseover`]),
        Mt(`onMouseLeave`, [`mouseout`, `mouseover`]),
        Mt(`onPointerEnter`, [`pointerout`, `pointerover`]),
        Mt(`onPointerLeave`, [`pointerout`, `pointerover`]),
        jt(
          `onChange`,
          `change click focusin focusout input keydown keyup selectionchange`.split(
            ` `,
          ),
        ),
        jt(
          `onSelect`,
          `focusout contextmenu dragend focusin keydown keyup mousedown mouseup selectionchange`.split(
            ` `,
          ),
        ),
        jt(`onBeforeInput`, [
          `compositionend`,
          `keypress`,
          `textInput`,
          `paste`,
        ]),
        jt(
          `onCompositionEnd`,
          `compositionend focusout keydown keypress keyup mousedown`.split(` `),
        ),
        jt(
          `onCompositionStart`,
          `compositionstart focusout keydown keypress keyup mousedown`.split(
            ` `,
          ),
        ),
        jt(
          `onCompositionUpdate`,
          `compositionupdate focusout keydown keypress keyup mousedown`.split(
            ` `,
          ),
        );
      var _d =
          `abort canplay canplaythrough durationchange emptied encrypted ended error loadeddata loadedmetadata loadstart pause play playing progress ratechange resize seeked seeking stalled suspend timeupdate volumechange waiting`.split(
            ` `,
          ),
        vd = new Set(
          `beforetoggle cancel close invalid load scroll scrollend toggle`
            .split(` `)
            .concat(_d),
        );
      function yd(e, t) {
        t = (t & 4) != 0;
        for (var n = 0; n < e.length; n++) {
          var r = e[n],
            i = r.event;
          r = r.listeners;
          a: {
            var a = void 0;
            if (t)
              for (var o = r.length - 1; 0 <= o; o--) {
                var s = r[o],
                  c = s.instance,
                  l = s.currentTarget;
                if (((s = s.listener), c !== a && i.isPropagationStopped()))
                  break a;
                (a = s), (i.currentTarget = l);
                try {
                  a(i);
                } catch (e) {
                  ti(e);
                }
                (i.currentTarget = null), (a = c);
              }
            else
              for (o = 0; o < r.length; o++) {
                if (
                  ((s = r[o]),
                  (c = s.instance),
                  (l = s.currentTarget),
                  (s = s.listener),
                  c !== a && i.isPropagationStopped())
                )
                  break a;
                (a = s), (i.currentTarget = l);
                try {
                  a(i);
                } catch (e) {
                  ti(e);
                }
                (i.currentTarget = null), (a = c);
              }
          }
        }
      }
      function Q(e, t) {
        var n = t[vt];
        n === void 0 && (n = t[vt] = new Set());
        var r = e + `__bubble`;
        n.has(r) || (Cd(t, e, 2, !1), n.add(r));
      }
      function bd(e, t, n) {
        var r = 0;
        t && (r |= 4), Cd(n, e, r, t);
      }
      var xd = `_reactListening` + Math.random().toString(36).slice(2);
      function Sd(e) {
        if (!e[xd]) {
          (e[xd] = !0),
            kt.forEach((t) => {
              t !== `selectionchange` &&
                (vd.has(t) || bd(t, !1, e), bd(t, !0, e));
            });
          var t = e.nodeType === 9 ? e : e.ownerDocument;
          t === null || t[xd] || ((t[xd] = !0), bd(`selectionchange`, !1, t));
        }
      }
      function Cd(e, t, n, r) {
        switch (mp(t)) {
          case 2: {
            var i = cp;
            break;
          }
          case 8:
            i = lp;
            break;
          default:
            i = up;
        }
        (n = i.bind(null, t, n, e)),
          (i = void 0),
          !_n ||
            (t !== `touchstart` && t !== `touchmove` && t !== `wheel`) ||
            (i = !0),
          r
            ? i === void 0
              ? e.addEventListener(t, n, !0)
              : e.addEventListener(t, n, { capture: !0, passive: i })
            : i === void 0
              ? e.addEventListener(t, n, !1)
              : e.addEventListener(t, n, { passive: i });
      }
      function wd(e, t, n, r, i) {
        var a = r;
        if (!(t & 1) && !(t & 2) && r !== null)
          a: for (;;) {
            if (r === null) return;
            var s = r.tag;
            if (s === 3 || s === 4) {
              var c = r.stateNode.containerInfo;
              if (c === i) break;
              if (s === 4)
                for (s = r.return; s !== null; ) {
                  var l = s.tag;
                  if ((l === 3 || l === 4) && s.stateNode.containerInfo === i)
                    return;
                  s = s.return;
                }
              for (; c !== null; ) {
                if (((s = wt(c)), s === null)) return;
                if (((l = s.tag), l === 5 || l === 6 || l === 26 || l === 27)) {
                  r = a = s;
                  continue a;
                }
                c = c.parentNode;
              }
            }
            r = r.return;
          }
        mn(() => {
          var r = a,
            i = un(n),
            s = [];
          a: {
            var c = $r.get(e);
            if (c !== void 0) {
              var l = Dn,
                u = e;
              switch (e) {
                case `keypress`:
                  if (M(n) === 0) break a;
                case `keydown`:
                case `keyup`:
                  l = Gn;
                  break;
                case `focusin`:
                  (u = `focus`), (l = In);
                  break;
                case `focusout`:
                  (u = `blur`), (l = In);
                  break;
                case `beforeblur`:
                case `afterblur`:
                  l = In;
                  break;
                case `click`:
                  if (n.button === 2) break a;
                case `auxclick`:
                case `dblclick`:
                case `mousedown`:
                case `mousemove`:
                case `mouseup`:
                case `mouseout`:
                case `mouseover`:
                case `contextmenu`:
                  l = Pn;
                  break;
                case `drag`:
                case `dragend`:
                case `dragenter`:
                case `dragexit`:
                case `dragleave`:
                case `dragover`:
                case `dragstart`:
                case `drop`:
                  l = Fn;
                  break;
                case `touchcancel`:
                case `touchend`:
                case `touchmove`:
                case `touchstart`:
                  l = qn;
                  break;
                case Kr:
                case qr:
                case Jr:
                  l = Ln;
                  break;
                case Qr:
                  l = Jn;
                  break;
                case `scroll`:
                case `scrollend`:
                  l = kn;
                  break;
                case `wheel`:
                  l = Yn;
                  break;
                case `copy`:
                case `cut`:
                case `paste`:
                  l = Rn;
                  break;
                case `gotpointercapture`:
                case `lostpointercapture`:
                case `pointercancel`:
                case `pointerdown`:
                case `pointermove`:
                case `pointerout`:
                case `pointerover`:
                case `pointerup`:
                  l = Kn;
                  break;
                case `toggle`:
                case `beforetoggle`:
                  l = Xn;
              }
              var d = (t & 4) != 0,
                f = !d && (e === `scroll` || e === `scrollend`),
                p = d ? (c === null ? null : c + `Capture`) : c;
              d = [];
              for (var m = r, h; m !== null; ) {
                var g = m;
                if (
                  ((h = g.stateNode),
                  (g = g.tag),
                  (g !== 5 && g !== 26 && g !== 27) ||
                    h === null ||
                    p === null ||
                    ((g = hn(m, p)), g != null && d.push(Td(m, g, h))),
                  f)
                )
                  break;
                m = m.return;
              }
              0 < d.length &&
                ((c = new l(c, u, null, n, i)),
                s.push({ event: c, listeners: d }));
            }
          }
          if (!(t & 7)) {
            a: {
              if (
                ((c = e === `mouseover` || e === `pointerover`),
                (l = e === `mouseout` || e === `pointerout`),
                c &&
                  n !== ln &&
                  (u = n.relatedTarget || n.fromElement) &&
                  (wt(u) || u[_t]))
              )
                break a;
              if (
                (l || c) &&
                ((c =
                  i.window === i
                    ? i
                    : (c = i.ownerDocument)
                      ? c.defaultView || c.parentWindow
                      : window),
                l
                  ? ((u = n.relatedTarget || n.toElement),
                    (l = r),
                    (u = u ? wt(u) : null),
                    u !== null &&
                      ((f = o(u)),
                      (d = u.tag),
                      u !== f || (d !== 5 && d !== 27 && d !== 6)) &&
                      (u = null))
                  : ((l = null), (u = r)),
                l !== u)
              ) {
                if (
                  ((d = Pn),
                  (g = `onMouseLeave`),
                  (p = `onMouseEnter`),
                  (m = `mouse`),
                  (e === `pointerout` || e === `pointerover`) &&
                    ((d = Kn),
                    (g = `onPointerLeave`),
                    (p = `onPointerEnter`),
                    (m = `pointer`)),
                  (f = l == null ? c : Et(l)),
                  (h = u == null ? c : Et(u)),
                  (c = new d(g, m + `leave`, l, n, i)),
                  (c.target = f),
                  (c.relatedTarget = h),
                  (g = null),
                  wt(i) === r &&
                    ((d = new d(p, m + `enter`, u, n, i)),
                    (d.target = h),
                    (d.relatedTarget = f),
                    (g = d)),
                  (f = g),
                  l && u)
                )
                  b: {
                    for (d = Dd, p = l, m = u, h = 0, g = p; g; g = d(g)) h++;
                    g = 0;
                    for (var _ = m; _; _ = d(_)) g++;
                    for (; 0 < h - g; ) (p = d(p)), h--;
                    for (; 0 < g - h; ) (m = d(m)), g--;
                    for (; h--; ) {
                      if (p === m || (m !== null && p === m.alternate)) {
                        d = p;
                        break b;
                      }
                      (p = d(p)), (m = d(m));
                    }
                    d = null;
                  }
                else d = null;
                l !== null && Od(s, c, l, d, !1),
                  u !== null && f !== null && Od(s, f, u, d, !0);
              }
            }
            a: {
              if (
                ((c = r ? Et(r) : window),
                (l = c.nodeName && c.nodeName.toLowerCase()),
                l === `select` || (l === `input` && c.type === `file`))
              )
                var v = gr;
              else if (ur(c))
                if (_r) v = Er;
                else {
                  v = wr;
                  var y = Cr;
                }
              else
                (l = c.nodeName),
                  !l ||
                  l.toLowerCase() !== `input` ||
                  (c.type !== `checkbox` && c.type !== `radio`)
                    ? r && rn(r.elementType) && (v = gr)
                    : (v = Tr);
              if ((v &&= v(e, r))) {
                dr(s, v, n, i);
                break a;
              }
              y && y(e, c, r),
                e === `focusout` &&
                  r &&
                  c.type === `number` &&
                  r.memoizedProps.value != null &&
                  Xt(c, `number`, c.value);
            }
            switch (((y = r ? Et(r) : window), e)) {
              case `focusin`:
                (ur(y) || y.contentEditable === `true`) &&
                  ((Ir = y), (Lr = r), (Rr = null));
                break;
              case `focusout`:
                Rr = Lr = Ir = null;
                break;
              case `mousedown`:
                zr = !0;
                break;
              case `contextmenu`:
              case `mouseup`:
              case `dragend`:
                (zr = !1), Br(s, n, i);
                break;
              case `selectionchange`:
                if (Fr) break;
              case `keydown`:
              case `keyup`:
                Br(s, n, i);
            }
            var b;
            if (Qn)
              b: {
                switch (e) {
                  case `compositionstart`: {
                    var x = `onCompositionStart`;
                    break b;
                  }
                  case `compositionend`:
                    x = `onCompositionEnd`;
                    break b;
                  case `compositionupdate`:
                    x = `onCompositionUpdate`;
                    break b;
                }
                x = void 0;
              }
            else
              or
                ? ir(e, n) && (x = `onCompositionEnd`)
                : e === `keydown` &&
                  n.keyCode === 229 &&
                  (x = `onCompositionStart`);
            x &&
              (tr &&
                n.locale !== `ko` &&
                (or || x !== `onCompositionStart`
                  ? x === `onCompositionEnd` && or && (b = Sn())
                  : ((yn = i),
                    (bn = `value` in yn ? yn.value : yn.textContent),
                    (or = !0))),
              (y = Ed(r, x)),
              0 < y.length &&
                ((x = new zn(x, e, null, n, i)),
                s.push({ event: x, listeners: y }),
                b ? (x.data = b) : ((b = ar(n)), b !== null && (x.data = b)))),
              (b = er ? sr(e, n) : cr(e, n)) &&
                ((x = Ed(r, `onBeforeInput`)),
                0 < x.length &&
                  ((y = new zn(`onBeforeInput`, `beforeinput`, null, n, i)),
                  s.push({ event: y, listeners: x }),
                  (y.data = b))),
              md(s, e, r, n, i);
          }
          yd(s, t);
        });
      }
      function Td(e, t, n) {
        return { instance: e, listener: t, currentTarget: n };
      }
      function Ed(e, t) {
        for (var n = t + `Capture`, r = []; e !== null; ) {
          var i = e,
            a = i.stateNode;
          if (
            ((i = i.tag),
            (i !== 5 && i !== 26 && i !== 27) ||
              a === null ||
              ((i = hn(e, n)),
              i != null && r.unshift(Td(e, i, a)),
              (i = hn(e, t)),
              i != null && r.push(Td(e, i, a))),
            e.tag === 3)
          )
            return r;
          e = e.return;
        }
        return [];
      }
      function Dd(e) {
        if (e === null) return null;
        do e = e.return;
        while (e && e.tag !== 5 && e.tag !== 27);
        return e || null;
      }
      function Od(e, t, n, r, i) {
        for (var a = t._reactName, o = []; n !== null && n !== r; ) {
          var s = n,
            c = s.alternate,
            l = s.stateNode;
          if (((s = s.tag), c !== null && c === r)) break;
          (s !== 5 && s !== 26 && s !== 27) ||
            l === null ||
            ((c = l),
            i
              ? ((l = hn(n, a)), l != null && o.unshift(Td(n, l, c)))
              : i || ((l = hn(n, a)), l != null && o.push(Td(n, l, c)))),
            (n = n.return);
        }
        o.length !== 0 && e.push({ event: t, listeners: o });
      }
      var kd = /\r\n?/g,
        Ad = /\u0000|\uFFFD/g;
      function jd(e) {
        return (typeof e == `string` ? e : `` + e)
          .replace(
            kd,
            `
`,
          )
          .replace(Ad, ``);
      }
      function Md(e, t) {
        return (t = jd(t)), jd(e) === t;
      }
      function $(e, t, n, r, a, o) {
        switch (n) {
          case `children`:
            typeof r == `string`
              ? t === `body` || (t === `textarea` && r === ``) || $t(e, r)
              : (typeof r == `number` || typeof r == `bigint`) &&
                t !== `body` &&
                $t(e, `` + r);
            break;
          case `className`:
            Rt(e, `class`, r);
            break;
          case `tabIndex`:
            Rt(e, `tabindex`, r);
            break;
          case `dir`:
          case `role`:
          case `viewBox`:
          case `width`:
          case `height`:
            Rt(e, n, r);
            break;
          case `style`:
            nn(e, r, o);
            break;
          case `data`:
            if (t !== `object`) {
              Rt(e, `data`, r);
              break;
            }
          case `src`:
          case `href`:
            if (r === `` && (t !== `a` || n !== `href`)) {
              e.removeAttribute(n);
              break;
            }
            if (
              r == null ||
              typeof r == `function` ||
              typeof r == `symbol` ||
              typeof r == `boolean`
            ) {
              e.removeAttribute(n);
              break;
            }
            (r = sn(`` + r)), e.setAttribute(n, r);
            break;
          case `action`:
          case `formAction`:
            if (typeof r == `function`) {
              e.setAttribute(
                n,
                `javascript:throw new Error('A React form was unexpectedly submitted. If you called form.submit() manually, consider using form.requestSubmit() instead. If you\\'re trying to use event.stopPropagation() in a submit event handler, consider also calling event.preventDefault().')`,
              );
              break;
            } else
              typeof o == `function` &&
                (n === `formAction`
                  ? (t !== `input` && $(e, t, `name`, a.name, a, null),
                    $(e, t, `formEncType`, a.formEncType, a, null),
                    $(e, t, `formMethod`, a.formMethod, a, null),
                    $(e, t, `formTarget`, a.formTarget, a, null))
                  : ($(e, t, `encType`, a.encType, a, null),
                    $(e, t, `method`, a.method, a, null),
                    $(e, t, `target`, a.target, a, null)));
            if (r == null || typeof r == `symbol` || typeof r == `boolean`) {
              e.removeAttribute(n);
              break;
            }
            (r = sn(`` + r)), e.setAttribute(n, r);
            break;
          case `onClick`:
            r != null && (e.onclick = cn);
            break;
          case `onScroll`:
            r != null && Q(`scroll`, e);
            break;
          case `onScrollEnd`:
            r != null && Q(`scrollend`, e);
            break;
          case `dangerouslySetInnerHTML`:
            if (r != null) {
              if (typeof r != `object` || !(`__html` in r)) throw Error(i(61));
              if (((n = r.__html), n != null)) {
                if (a.children != null) throw Error(i(60));
                e.innerHTML = n;
              }
            }
            break;
          case `multiple`:
            e.multiple = r && typeof r != `function` && typeof r != `symbol`;
            break;
          case `muted`:
            e.muted = r && typeof r != `function` && typeof r != `symbol`;
            break;
          case `suppressContentEditableWarning`:
          case `suppressHydrationWarning`:
          case `defaultValue`:
          case `defaultChecked`:
          case `innerHTML`:
          case `ref`:
            break;
          case `autoFocus`:
            break;
          case `xlinkHref`:
            if (
              r == null ||
              typeof r == `function` ||
              typeof r == `boolean` ||
              typeof r == `symbol`
            ) {
              e.removeAttribute(`xlink:href`);
              break;
            }
            (n = sn(`` + r)),
              e.setAttributeNS(`http://www.w3.org/1999/xlink`, `xlink:href`, n);
            break;
          case `contentEditable`:
          case `spellCheck`:
          case `draggable`:
          case `value`:
          case `autoReverse`:
          case `externalResourcesRequired`:
          case `focusable`:
          case `preserveAlpha`:
            r != null && typeof r != `function` && typeof r != `symbol`
              ? e.setAttribute(n, `` + r)
              : e.removeAttribute(n);
            break;
          case `inert`:
          case `allowFullScreen`:
          case `async`:
          case `autoPlay`:
          case `controls`:
          case `default`:
          case `defer`:
          case `disabled`:
          case `disablePictureInPicture`:
          case `disableRemotePlayback`:
          case `formNoValidate`:
          case `hidden`:
          case `loop`:
          case `noModule`:
          case `noValidate`:
          case `open`:
          case `playsInline`:
          case `readOnly`:
          case `required`:
          case `reversed`:
          case `scoped`:
          case `seamless`:
          case `itemScope`:
            r && typeof r != `function` && typeof r != `symbol`
              ? e.setAttribute(n, ``)
              : e.removeAttribute(n);
            break;
          case `capture`:
          case `download`:
            !0 === r
              ? e.setAttribute(n, ``)
              : !1 !== r &&
                  r != null &&
                  typeof r != `function` &&
                  typeof r != `symbol`
                ? e.setAttribute(n, r)
                : e.removeAttribute(n);
            break;
          case `cols`:
          case `rows`:
          case `size`:
          case `span`:
            r != null &&
            typeof r != `function` &&
            typeof r != `symbol` &&
            !isNaN(r) &&
            1 <= r
              ? e.setAttribute(n, r)
              : e.removeAttribute(n);
            break;
          case `rowSpan`:
          case `start`:
            r == null ||
            typeof r == `function` ||
            typeof r == `symbol` ||
            isNaN(r)
              ? e.removeAttribute(n)
              : e.setAttribute(n, r);
            break;
          case `popover`:
            Q(`beforetoggle`, e), Q(`toggle`, e), Lt(e, `popover`, r);
            break;
          case `xlinkActuate`:
            zt(e, `http://www.w3.org/1999/xlink`, `xlink:actuate`, r);
            break;
          case `xlinkArcrole`:
            zt(e, `http://www.w3.org/1999/xlink`, `xlink:arcrole`, r);
            break;
          case `xlinkRole`:
            zt(e, `http://www.w3.org/1999/xlink`, `xlink:role`, r);
            break;
          case `xlinkShow`:
            zt(e, `http://www.w3.org/1999/xlink`, `xlink:show`, r);
            break;
          case `xlinkTitle`:
            zt(e, `http://www.w3.org/1999/xlink`, `xlink:title`, r);
            break;
          case `xlinkType`:
            zt(e, `http://www.w3.org/1999/xlink`, `xlink:type`, r);
            break;
          case `xmlBase`:
            zt(e, `http://www.w3.org/XML/1998/namespace`, `xml:base`, r);
            break;
          case `xmlLang`:
            zt(e, `http://www.w3.org/XML/1998/namespace`, `xml:lang`, r);
            break;
          case `xmlSpace`:
            zt(e, `http://www.w3.org/XML/1998/namespace`, `xml:space`, r);
            break;
          case `is`:
            Lt(e, `is`, r);
            break;
          case `innerText`:
          case `textContent`:
            break;
          default:
            (!(2 < n.length) ||
              (n[0] !== `o` && n[0] !== `O`) ||
              (n[1] !== `n` && n[1] !== `N`)) &&
              ((n = an.get(n) || n), Lt(e, n, r));
        }
      }
      function Nd(e, t, n, r, a, o) {
        switch (n) {
          case `style`:
            nn(e, r, o);
            break;
          case `dangerouslySetInnerHTML`:
            if (r != null) {
              if (typeof r != `object` || !(`__html` in r)) throw Error(i(61));
              if (((n = r.__html), n != null)) {
                if (a.children != null) throw Error(i(60));
                e.innerHTML = n;
              }
            }
            break;
          case `children`:
            typeof r == `string`
              ? $t(e, r)
              : (typeof r == `number` || typeof r == `bigint`) && $t(e, `` + r);
            break;
          case `onScroll`:
            r != null && Q(`scroll`, e);
            break;
          case `onScrollEnd`:
            r != null && Q(`scrollend`, e);
            break;
          case `onClick`:
            r != null && (e.onclick = cn);
            break;
          case `suppressContentEditableWarning`:
          case `suppressHydrationWarning`:
          case `innerHTML`:
          case `ref`:
            break;
          case `innerText`:
          case `textContent`:
            break;
          default:
            if (!Object.hasOwn(At, n))
              a: {
                if (
                  n[0] === `o` &&
                  n[1] === `n` &&
                  ((a = n.endsWith(`Capture`)),
                  (t = n.slice(2, a ? n.length - 7 : void 0)),
                  (o = e[gt] || null),
                  (o = o == null ? null : o[n]),
                  typeof o == `function` && e.removeEventListener(t, o, a),
                  typeof r == `function`)
                ) {
                  typeof o != `function` &&
                    o !== null &&
                    (n in e
                      ? (e[n] = null)
                      : e.hasAttribute(n) && e.removeAttribute(n)),
                    e.addEventListener(t, r, a);
                  break a;
                }
                n in e
                  ? (e[n] = r)
                  : !0 === r
                    ? e.setAttribute(n, ``)
                    : Lt(e, n, r);
              }
        }
      }
      function Pd(e, t, n) {
        switch (t) {
          case `div`:
          case `span`:
          case `svg`:
          case `path`:
          case `a`:
          case `g`:
          case `p`:
          case `li`:
            break;
          case `img`: {
            Q(`error`, e), Q(`load`, e);
            var r = !1,
              a = !1,
              o;
            for (o in n)
              if (Object.hasOwn(n, o)) {
                var s = n[o];
                if (s != null)
                  switch (o) {
                    case `src`:
                      r = !0;
                      break;
                    case `srcSet`:
                      a = !0;
                      break;
                    case `children`:
                    case `dangerouslySetInnerHTML`:
                      throw Error(i(137, t));
                    default:
                      $(e, t, o, s, n, null);
                  }
              }
            a && $(e, t, `srcSet`, n.srcSet, n, null),
              r && $(e, t, `src`, n.src, n, null);
            return;
          }
          case `input`: {
            Q(`invalid`, e);
            var c = (o = s = a = null),
              l = null,
              u = null;
            for (r in n)
              if (Object.hasOwn(n, r)) {
                var d = n[r];
                if (d != null)
                  switch (r) {
                    case `name`:
                      a = d;
                      break;
                    case `type`:
                      s = d;
                      break;
                    case `checked`:
                      l = d;
                      break;
                    case `defaultChecked`:
                      u = d;
                      break;
                    case `value`:
                      o = d;
                      break;
                    case `defaultValue`:
                      c = d;
                      break;
                    case `children`:
                    case `dangerouslySetInnerHTML`:
                      if (d != null) throw Error(i(137, t));
                      break;
                    default:
                      $(e, t, r, d, n, null);
                  }
              }
            Yt(e, o, c, l, u, s, a, !1);
            return;
          }
          case `select`:
            for (a in (Q(`invalid`, e), (r = s = o = null), n))
              if (Object.hasOwn(n, a) && ((c = n[a]), c != null))
                switch (a) {
                  case `value`:
                    o = c;
                    break;
                  case `defaultValue`:
                    s = c;
                    break;
                  case `multiple`:
                    r = c;
                  default:
                    $(e, t, a, c, n, null);
                }
            (t = o),
              (n = s),
              (e.multiple = !!r),
              t == null ? n != null && Zt(e, !!r, n, !0) : Zt(e, !!r, t, !1);
            return;
          case `textarea`:
            for (s in (Q(`invalid`, e), (o = a = r = null), n))
              if (Object.hasOwn(n, s) && ((c = n[s]), c != null))
                switch (s) {
                  case `value`:
                    r = c;
                    break;
                  case `defaultValue`:
                    a = c;
                    break;
                  case `children`:
                    o = c;
                    break;
                  case `dangerouslySetInnerHTML`:
                    if (c != null) throw Error(i(91));
                    break;
                  default:
                    $(e, t, s, c, n, null);
                }
            A(e, r, a, o);
            return;
          case `option`:
            for (l in n)
              if (Object.hasOwn(n, l) && ((r = n[l]), r != null))
                switch (l) {
                  case `selected`:
                    e.selected =
                      r && typeof r != `function` && typeof r != `symbol`;
                    break;
                  default:
                    $(e, t, l, r, n, null);
                }
            return;
          case `dialog`:
            Q(`beforetoggle`, e), Q(`toggle`, e), Q(`cancel`, e), Q(`close`, e);
            break;
          case `iframe`:
          case `object`:
            Q(`load`, e);
            break;
          case `video`:
          case `audio`:
            for (r = 0; r < _d.length; r++) Q(_d[r], e);
            break;
          case `image`:
            Q(`error`, e), Q(`load`, e);
            break;
          case `details`:
            Q(`toggle`, e);
            break;
          case `embed`:
          case `source`:
          case `link`:
            Q(`error`, e), Q(`load`, e);
          case `area`:
          case `base`:
          case `br`:
          case `col`:
          case `hr`:
          case `keygen`:
          case `meta`:
          case `param`:
          case `track`:
          case `wbr`:
          case `menuitem`:
            for (u in n)
              if (Object.hasOwn(n, u) && ((r = n[u]), r != null))
                switch (u) {
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    throw Error(i(137, t));
                  default:
                    $(e, t, u, r, n, null);
                }
            return;
          default:
            if (rn(t)) {
              for (d in n)
                Object.hasOwn(n, d) &&
                  ((r = n[d]), r !== void 0 && Nd(e, t, d, r, n, void 0));
              return;
            }
        }
        for (c in n)
          Object.hasOwn(n, c) &&
            ((r = n[c]), r != null && $(e, t, c, r, n, null));
      }
      function Fd(e, t, n, r) {
        switch (t) {
          case `div`:
          case `span`:
          case `svg`:
          case `path`:
          case `a`:
          case `g`:
          case `p`:
          case `li`:
            break;
          case `input`: {
            var a = null,
              o = null,
              s = null,
              c = null,
              l = null,
              u = null,
              d = null;
            for (m in n) {
              var f = n[m];
              if (Object.hasOwn(n, m) && f != null)
                switch (m) {
                  case `checked`:
                    break;
                  case `value`:
                    break;
                  case `defaultValue`:
                    l = f;
                  default:
                    Object.hasOwn(r, m) || $(e, t, m, null, r, f);
                }
            }
            for (var p in r) {
              var m = r[p];
              if (((f = n[p]), Object.hasOwn(r, p) && (m != null || f != null)))
                switch (p) {
                  case `type`:
                    o = m;
                    break;
                  case `name`:
                    a = m;
                    break;
                  case `checked`:
                    u = m;
                    break;
                  case `defaultChecked`:
                    d = m;
                    break;
                  case `value`:
                    s = m;
                    break;
                  case `defaultValue`:
                    c = m;
                    break;
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    if (m != null) throw Error(i(137, t));
                    break;
                  default:
                    m !== f && $(e, t, p, m, r, f);
                }
            }
            Jt(e, s, c, l, u, d, o, a);
            return;
          }
          case `select`:
            for (o in ((m = s = c = p = null), n))
              if (((l = n[o]), Object.hasOwn(n, o) && l != null))
                switch (o) {
                  case `value`:
                    break;
                  case `multiple`:
                    m = l;
                  default:
                    Object.hasOwn(r, o) || $(e, t, o, null, r, l);
                }
            for (a in r)
              if (
                ((o = r[a]),
                (l = n[a]),
                Object.hasOwn(r, a) && (o != null || l != null))
              )
                switch (a) {
                  case `value`:
                    p = o;
                    break;
                  case `defaultValue`:
                    c = o;
                    break;
                  case `multiple`:
                    s = o;
                  default:
                    o !== l && $(e, t, a, o, r, l);
                }
            (t = c),
              (n = s),
              (r = m),
              p == null
                ? !!r != !!n &&
                  (t == null ? Zt(e, !!n, n ? [] : ``, !1) : Zt(e, !!n, t, !0))
                : Zt(e, !!n, p, !1);
            return;
          case `textarea`:
            for (c in ((m = p = null), n))
              if (
                ((a = n[c]),
                Object.hasOwn(n, c) && a != null && !Object.hasOwn(r, c))
              )
                switch (c) {
                  case `value`:
                    break;
                  case `children`:
                    break;
                  default:
                    $(e, t, c, null, r, a);
                }
            for (s in r)
              if (
                ((a = r[s]),
                (o = n[s]),
                Object.hasOwn(r, s) && (a != null || o != null))
              )
                switch (s) {
                  case `value`:
                    p = a;
                    break;
                  case `defaultValue`:
                    m = a;
                    break;
                  case `children`:
                    break;
                  case `dangerouslySetInnerHTML`:
                    if (a != null) throw Error(i(91));
                    break;
                  default:
                    a !== o && $(e, t, s, a, r, o);
                }
            Qt(e, p, m);
            return;
          case `option`:
            for (var h in n)
              if (
                ((p = n[h]),
                Object.hasOwn(n, h) && p != null && !Object.hasOwn(r, h))
              )
                switch (h) {
                  case `selected`:
                    e.selected = !1;
                    break;
                  default:
                    $(e, t, h, null, r, p);
                }
            for (l in r)
              if (
                ((p = r[l]),
                (m = n[l]),
                Object.hasOwn(r, l) && p !== m && (p != null || m != null))
              )
                switch (l) {
                  case `selected`:
                    e.selected =
                      p && typeof p != `function` && typeof p != `symbol`;
                    break;
                  default:
                    $(e, t, l, p, r, m);
                }
            return;
          case `img`:
          case `link`:
          case `area`:
          case `base`:
          case `br`:
          case `col`:
          case `embed`:
          case `hr`:
          case `keygen`:
          case `meta`:
          case `param`:
          case `source`:
          case `track`:
          case `wbr`:
          case `menuitem`:
            for (var g in n)
              (p = n[g]),
                Object.hasOwn(n, g) &&
                  p != null &&
                  !Object.hasOwn(r, g) &&
                  $(e, t, g, null, r, p);
            for (u in r)
              if (
                ((p = r[u]),
                (m = n[u]),
                Object.hasOwn(r, u) && p !== m && (p != null || m != null))
              )
                switch (u) {
                  case `children`:
                  case `dangerouslySetInnerHTML`:
                    if (p != null) throw Error(i(137, t));
                    break;
                  default:
                    $(e, t, u, p, r, m);
                }
            return;
          default:
            if (rn(t)) {
              for (var _ in n)
                (p = n[_]),
                  Object.hasOwn(n, _) &&
                    p !== void 0 &&
                    !Object.hasOwn(r, _) &&
                    Nd(e, t, _, void 0, r, p);
              for (d in r)
                (p = r[d]),
                  (m = n[d]),
                  !Object.hasOwn(r, d) ||
                    p === m ||
                    (p === void 0 && m === void 0) ||
                    Nd(e, t, d, p, r, m);
              return;
            }
        }
        for (var v in n)
          (p = n[v]),
            Object.hasOwn(n, v) &&
              p != null &&
              !Object.hasOwn(r, v) &&
              $(e, t, v, null, r, p);
        for (f in r)
          (p = r[f]),
            (m = n[f]),
            !Object.hasOwn(r, f) ||
              p === m ||
              (p == null && m == null) ||
              $(e, t, f, p, r, m);
      }
      function Id(e) {
        switch (e) {
          case `css`:
          case `script`:
          case `font`:
          case `img`:
          case `image`:
          case `input`:
          case `link`:
            return !0;
          default:
            return !1;
        }
      }
      function Ld() {
        if (typeof performance.getEntriesByType == `function`) {
          for (
            var e = 0,
              t = 0,
              n = performance.getEntriesByType(`resource`),
              r = 0;
            r < n.length;
            r++
          ) {
            var i = n[r],
              a = i.transferSize,
              o = i.initiatorType,
              s = i.duration;
            if (a && s && Id(o)) {
              for (o = 0, s = i.responseEnd, r += 1; r < n.length; r++) {
                var c = n[r],
                  l = c.startTime;
                if (l > s) break;
                var u = c.transferSize,
                  d = c.initiatorType;
                u &&
                  Id(d) &&
                  ((c = c.responseEnd),
                  (o += u * (c < s ? 1 : (s - l) / (c - l))));
              }
              if ((--r, (t += (8 * (a + o)) / (i.duration / 1e3)), e++, 10 < e))
                break;
            }
          }
          if (0 < e) return t / e / 1e6;
        }
        return navigator.connection &&
          ((e = navigator.connection.downlink), typeof e == `number`)
          ? e
          : 5;
      }
      var Rd = null,
        zd = null;
      function Bd(e) {
        return e.nodeType === 9 ? e : e.ownerDocument;
      }
      function Vd(e) {
        switch (e) {
          case `http://www.w3.org/2000/svg`:
            return 1;
          case `http://www.w3.org/1998/Math/MathML`:
            return 2;
          default:
            return 0;
        }
      }
      function Hd(e, t) {
        if (e === 0)
          switch (t) {
            case `svg`:
              return 1;
            case `math`:
              return 2;
            default:
              return 0;
          }
        return e === 1 && t === `foreignObject` ? 0 : e;
      }
      function Ud(e, t) {
        return (
          e === `textarea` ||
          e === `noscript` ||
          typeof t.children == `string` ||
          typeof t.children == `number` ||
          typeof t.children == `bigint` ||
          (typeof t.dangerouslySetInnerHTML == `object` &&
            t.dangerouslySetInnerHTML !== null &&
            t.dangerouslySetInnerHTML.__html != null)
        );
      }
      var Wd = null;
      function Gd() {
        var e = window.event;
        return e && e.type === `popstate`
          ? e === Wd
            ? !1
            : ((Wd = e), !0)
          : ((Wd = null), !1);
      }
      var Kd = typeof setTimeout == `function` ? setTimeout : void 0,
        qd = typeof clearTimeout == `function` ? clearTimeout : void 0,
        Jd = typeof Promise == `function` ? Promise : void 0,
        Yd =
          typeof queueMicrotask == `function`
            ? queueMicrotask
            : Jd === void 0
              ? Kd
              : (e) => Jd.resolve(null).then(e).catch(Xd);
      function Xd(e) {
        setTimeout(() => {
          throw e;
        });
      }
      function Zd(e) {
        return e === `head`;
      }
      function Qd(e, t) {
        var n = t,
          r = 0;
        do {
          var i = n.nextSibling;
          if ((e.removeChild(n), i && i.nodeType === 8))
            if (((n = i.data), n === `/$` || n === `/&`)) {
              if (r === 0) {
                e.removeChild(i), Np(t);
                return;
              }
              r--;
            } else if (
              n === `$` ||
              n === `$?` ||
              n === `$~` ||
              n === `$!` ||
              n === `&`
            )
              r++;
            else if (n === `html`) pf(e.ownerDocument.documentElement);
            else if (n === `head`) {
              (n = e.ownerDocument.head), pf(n);
              for (var a = n.firstChild; a; ) {
                var o = a.nextSibling,
                  s = a.nodeName;
                a[St] ||
                  s === `SCRIPT` ||
                  s === `STYLE` ||
                  (s === `LINK` && a.rel.toLowerCase() === `stylesheet`) ||
                  n.removeChild(a),
                  (a = o);
              }
            } else n === `body` && pf(e.ownerDocument.body);
          n = i;
        } while (n);
        Np(t);
      }
      function $d(e, t) {
        var n = e;
        e = 0;
        do {
          var r = n.nextSibling;
          if (
            (n.nodeType === 1
              ? t
                ? ((n._stashedDisplay = n.style.display),
                  (n.style.display = `none`))
                : ((n.style.display = n._stashedDisplay || ``),
                  n.getAttribute(`style`) === `` && n.removeAttribute(`style`))
              : n.nodeType === 3 &&
                (t
                  ? ((n._stashedText = n.nodeValue), (n.nodeValue = ``))
                  : (n.nodeValue = n._stashedText || ``)),
            r && r.nodeType === 8)
          )
            if (((n = r.data), n === `/$`)) {
              if (e === 0) break;
              e--;
            } else (n !== `$` && n !== `$?` && n !== `$~` && n !== `$!`) || e++;
          n = r;
        } while (n);
      }
      function ef(e) {
        var t = e.firstChild;
        for (t && t.nodeType === 10 && (t = t.nextSibling); t; ) {
          var n = t;
          switch (((t = t.nextSibling), n.nodeName)) {
            case `HTML`:
            case `HEAD`:
            case `BODY`:
              ef(n), Ct(n);
              continue;
            case `SCRIPT`:
            case `STYLE`:
              continue;
            case `LINK`:
              if (n.rel.toLowerCase() === `stylesheet`) continue;
          }
          e.removeChild(n);
        }
      }
      function tf(e, t, n, r) {
        for (; e.nodeType === 1; ) {
          var i = n;
          if (e.nodeName.toLowerCase() !== t.toLowerCase()) {
            if (!r && (e.nodeName !== `INPUT` || e.type !== `hidden`)) break;
          } else if (!r)
            if (t === `input` && e.type === `hidden`) {
              var a = i.name == null ? null : `` + i.name;
              if (i.type === `hidden` && e.getAttribute(`name`) === a) return e;
            } else return e;
          else if (!e[St])
            switch (t) {
              case `meta`:
                if (!e.hasAttribute(`itemprop`)) break;
                return e;
              case `link`:
                if (
                  ((a = e.getAttribute(`rel`)),
                  (a === `stylesheet` && e.hasAttribute(`data-precedence`)) ||
                    a !== i.rel ||
                    e.getAttribute(`href`) !==
                      (i.href == null || i.href === `` ? null : i.href) ||
                    e.getAttribute(`crossorigin`) !==
                      (i.crossOrigin == null ? null : i.crossOrigin) ||
                    e.getAttribute(`title`) !==
                      (i.title == null ? null : i.title))
                )
                  break;
                return e;
              case `style`:
                if (e.hasAttribute(`data-precedence`)) break;
                return e;
              case `script`:
                if (
                  ((a = e.getAttribute(`src`)),
                  (a !== (i.src == null ? null : i.src) ||
                    e.getAttribute(`type`) !==
                      (i.type == null ? null : i.type) ||
                    e.getAttribute(`crossorigin`) !==
                      (i.crossOrigin == null ? null : i.crossOrigin)) &&
                    a &&
                    e.hasAttribute(`async`) &&
                    !e.hasAttribute(`itemprop`))
                )
                  break;
                return e;
              default:
                return e;
            }
          if (((e = cf(e.nextSibling)), e === null)) break;
        }
        return null;
      }
      function nf(e, t, n) {
        if (t === ``) return null;
        for (; e.nodeType !== 3; )
          if (
            ((e.nodeType !== 1 ||
              e.nodeName !== `INPUT` ||
              e.type !== `hidden`) &&
              !n) ||
            ((e = cf(e.nextSibling)), e === null)
          )
            return null;
        return e;
      }
      function rf(e, t) {
        for (; e.nodeType !== 8; )
          if (
            ((e.nodeType !== 1 ||
              e.nodeName !== `INPUT` ||
              e.type !== `hidden`) &&
              !t) ||
            ((e = cf(e.nextSibling)), e === null)
          )
            return null;
        return e;
      }
      function af(e) {
        return e.data === `$?` || e.data === `$~`;
      }
      function of(e) {
        return (
          e.data === `$!` ||
          (e.data === `$?` && e.ownerDocument.readyState !== `loading`)
        );
      }
      function sf(e, t) {
        var n = e.ownerDocument;
        if (e.data === `$~`) e._reactRetry = t;
        else if (e.data !== `$?` || n.readyState !== `loading`) t();
        else {
          var r = () => {
            t(), n.removeEventListener(`DOMContentLoaded`, r);
          };
          n.addEventListener(`DOMContentLoaded`, r), (e._reactRetry = r);
        }
      }
      function cf(e) {
        for (; e != null; e = e.nextSibling) {
          var t = e.nodeType;
          if (t === 1 || t === 3) break;
          if (t === 8) {
            if (
              ((t = e.data),
              t === `$` ||
                t === `$!` ||
                t === `$?` ||
                t === `$~` ||
                t === `&` ||
                t === `F!` ||
                t === `F`)
            )
              break;
            if (t === `/$` || t === `/&`) return null;
          }
        }
        return e;
      }
      var lf = null;
      function uf(e) {
        e = e.nextSibling;
        for (var t = 0; e; ) {
          if (e.nodeType === 8) {
            var n = e.data;
            if (n === `/$` || n === `/&`) {
              if (t === 0) return cf(e.nextSibling);
              t--;
            } else
              (n !== `$` &&
                n !== `$!` &&
                n !== `$?` &&
                n !== `$~` &&
                n !== `&`) ||
                t++;
          }
          e = e.nextSibling;
        }
        return null;
      }
      function df(e) {
        e = e.previousSibling;
        for (var t = 0; e; ) {
          if (e.nodeType === 8) {
            var n = e.data;
            if (
              n === `$` ||
              n === `$!` ||
              n === `$?` ||
              n === `$~` ||
              n === `&`
            ) {
              if (t === 0) return e;
              t--;
            } else (n !== `/$` && n !== `/&`) || t++;
          }
          e = e.previousSibling;
        }
        return null;
      }
      function ff(e, t, n) {
        switch (((t = Bd(n)), e)) {
          case `html`:
            if (((e = t.documentElement), !e)) throw Error(i(452));
            return e;
          case `head`:
            if (((e = t.head), !e)) throw Error(i(453));
            return e;
          case `body`:
            if (((e = t.body), !e)) throw Error(i(454));
            return e;
          default:
            throw Error(i(451));
        }
      }
      function pf(e) {
        for (var t = e.attributes; t.length; ) e.removeAttributeNode(t[0]);
        Ct(e);
      }
      var mf = new Map(),
        hf = new Set();
      function gf(e) {
        return typeof e.getRootNode == `function`
          ? e.getRootNode()
          : e.nodeType === 9
            ? e
            : e.ownerDocument;
      }
      var _f = E.d;
      E.d = { f: vf, r: yf, D: Sf, C: Cf, L: wf, m: Tf, X: Df, S: Ef, M: Of };
      function vf() {
        var e = _f.f(),
          t = bu();
        return e || t;
      }
      function yf(e) {
        var t = Tt(e);
        t !== null && t.tag === 5 && t.type === `form` ? As(t) : _f.r(e);
      }
      var bf = typeof document > `u` ? null : document;
      function xf(e, t, n) {
        var r = bf;
        if (r && typeof t == `string` && t) {
          var i = qt(t);
          (i = `link[rel="` + e + `"][href="` + i + `"]`),
            typeof n == `string` && (i += `[crossorigin="` + n + `"]`),
            hf.has(i) ||
              (hf.add(i),
              (e = { rel: e, crossOrigin: n, href: t }),
              r.querySelector(i) === null &&
                ((t = r.createElement(`link`)),
                Pd(t, `link`, e),
                Ot(t),
                r.head.appendChild(t)));
        }
      }
      function Sf(e) {
        _f.D(e), xf(`dns-prefetch`, e, null);
      }
      function Cf(e, t) {
        _f.C(e, t), xf(`preconnect`, e, t);
      }
      function wf(e, t, n) {
        _f.L(e, t, n);
        var r = bf;
        if (r && e && t) {
          var i = `link[rel="preload"][as="` + qt(t) + `"]`;
          t === `image` && n && n.imageSrcSet
            ? ((i += `[imagesrcset="` + qt(n.imageSrcSet) + `"]`),
              typeof n.imageSizes == `string` &&
                (i += `[imagesizes="` + qt(n.imageSizes) + `"]`))
            : (i += `[href="` + qt(e) + `"]`);
          var a = i;
          switch (t) {
            case `style`:
              a = Af(e);
              break;
            case `script`:
              a = Pf(e);
          }
          mf.has(a) ||
            ((e = h(
              {
                rel: `preload`,
                href: t === `image` && n && n.imageSrcSet ? void 0 : e,
                as: t,
              },
              n,
            )),
            mf.set(a, e),
            r.querySelector(i) !== null ||
              (t === `style` && r.querySelector(jf(a))) ||
              (t === `script` && r.querySelector(Ff(a))) ||
              ((t = r.createElement(`link`)),
              Pd(t, `link`, e),
              Ot(t),
              r.head.appendChild(t)));
        }
      }
      function Tf(e, t) {
        _f.m(e, t);
        var n = bf;
        if (n && e) {
          var r = t && typeof t.as == `string` ? t.as : `script`,
            i =
              `link[rel="modulepreload"][as="` +
              qt(r) +
              `"][href="` +
              qt(e) +
              `"]`,
            a = i;
          switch (r) {
            case `audioworklet`:
            case `paintworklet`:
            case `serviceworker`:
            case `sharedworker`:
            case `worker`:
            case `script`:
              a = Pf(e);
          }
          if (
            !mf.has(a) &&
            ((e = h({ rel: `modulepreload`, href: e }, t)),
            mf.set(a, e),
            n.querySelector(i) === null)
          ) {
            switch (r) {
              case `audioworklet`:
              case `paintworklet`:
              case `serviceworker`:
              case `sharedworker`:
              case `worker`:
              case `script`:
                if (n.querySelector(Ff(a))) return;
            }
            (r = n.createElement(`link`)),
              Pd(r, `link`, e),
              Ot(r),
              n.head.appendChild(r);
          }
        }
      }
      function Ef(e, t, n) {
        _f.S(e, t, n);
        var r = bf;
        if (r && e) {
          var i = Dt(r).hoistableStyles,
            a = Af(e);
          t ||= `default`;
          var o = i.get(a);
          if (!o) {
            var s = { loading: 0, preload: null };
            if ((o = r.querySelector(jf(a)))) s.loading = 5;
            else {
              (e = h({ rel: `stylesheet`, href: e, "data-precedence": t }, n)),
                (n = mf.get(a)) && Rf(e, n);
              var c = (o = r.createElement(`link`));
              Ot(c),
                Pd(c, `link`, e),
                (c._p = new Promise((e, t) => {
                  (c.onload = e), (c.onerror = t);
                })),
                c.addEventListener(`load`, () => {
                  s.loading |= 1;
                }),
                c.addEventListener(`error`, () => {
                  s.loading |= 2;
                }),
                (s.loading |= 4),
                Lf(o, t, r);
            }
            (o = { type: `stylesheet`, instance: o, count: 1, state: s }),
              i.set(a, o);
          }
        }
      }
      function Df(e, t) {
        _f.X(e, t);
        var n = bf;
        if (n && e) {
          var r = Dt(n).hoistableScripts,
            i = Pf(e),
            a = r.get(i);
          a ||
            ((a = n.querySelector(Ff(i))),
            a ||
              ((e = h({ src: e, async: !0 }, t)),
              (t = mf.get(i)) && zf(e, t),
              (a = n.createElement(`script`)),
              Ot(a),
              Pd(a, `link`, e),
              n.head.appendChild(a)),
            (a = { type: `script`, instance: a, count: 1, state: null }),
            r.set(i, a));
        }
      }
      function Of(e, t) {
        _f.M(e, t);
        var n = bf;
        if (n && e) {
          var r = Dt(n).hoistableScripts,
            i = Pf(e),
            a = r.get(i);
          a ||
            ((a = n.querySelector(Ff(i))),
            a ||
              ((e = h({ src: e, async: !0, type: `module` }, t)),
              (t = mf.get(i)) && zf(e, t),
              (a = n.createElement(`script`)),
              Ot(a),
              Pd(a, `link`, e),
              n.head.appendChild(a)),
            (a = { type: `script`, instance: a, count: 1, state: null }),
            r.set(i, a));
        }
      }
      function kf(e, t, n, r) {
        var a = (a = ve.current) ? gf(a) : null;
        if (!a) throw Error(i(446));
        switch (e) {
          case `meta`:
          case `title`:
            return null;
          case `style`:
            return typeof n.precedence == `string` && typeof n.href == `string`
              ? ((t = Af(n.href)),
                (n = Dt(a).hoistableStyles),
                (r = n.get(t)),
                r ||
                  ((r = {
                    type: `style`,
                    instance: null,
                    count: 0,
                    state: null,
                  }),
                  n.set(t, r)),
                r)
              : { type: `void`, instance: null, count: 0, state: null };
          case `link`:
            if (
              n.rel === `stylesheet` &&
              typeof n.href == `string` &&
              typeof n.precedence == `string`
            ) {
              e = Af(n.href);
              var o = Dt(a).hoistableStyles,
                s = o.get(e);
              if (
                (s ||
                  ((a = a.ownerDocument || a),
                  (s = {
                    type: `stylesheet`,
                    instance: null,
                    count: 0,
                    state: { loading: 0, preload: null },
                  }),
                  o.set(e, s),
                  (o = a.querySelector(jf(e))) &&
                    !o._p &&
                    ((s.instance = o), (s.state.loading = 5)),
                  mf.has(e) ||
                    ((n = {
                      rel: `preload`,
                      as: `style`,
                      href: n.href,
                      crossOrigin: n.crossOrigin,
                      integrity: n.integrity,
                      media: n.media,
                      hrefLang: n.hrefLang,
                      referrerPolicy: n.referrerPolicy,
                    }),
                    mf.set(e, n),
                    o || Nf(a, e, n, s.state))),
                t && r === null)
              )
                throw Error(i(528, ``));
              return s;
            }
            if (t && r !== null) throw Error(i(529, ``));
            return null;
          case `script`:
            return (
              (t = n.async),
              (n = n.src),
              typeof n == `string` &&
              t &&
              typeof t != `function` &&
              typeof t != `symbol`
                ? ((t = Pf(n)),
                  (n = Dt(a).hoistableScripts),
                  (r = n.get(t)),
                  r ||
                    ((r = {
                      type: `script`,
                      instance: null,
                      count: 0,
                      state: null,
                    }),
                    n.set(t, r)),
                  r)
                : { type: `void`, instance: null, count: 0, state: null }
            );
          default:
            throw Error(i(444, e));
        }
      }
      function Af(e) {
        return `href="` + qt(e) + `"`;
      }
      function jf(e) {
        return `link[rel="stylesheet"][` + e + `]`;
      }
      function Mf(e) {
        return h({}, e, { "data-precedence": e.precedence, precedence: null });
      }
      function Nf(e, t, n, r) {
        e.querySelector(`link[rel="preload"][as="style"][` + t + `]`)
          ? (r.loading = 1)
          : ((t = e.createElement(`link`)),
            (r.preload = t),
            t.addEventListener(`load`, () => (r.loading |= 1)),
            t.addEventListener(`error`, () => (r.loading |= 2)),
            Pd(t, `link`, n),
            Ot(t),
            e.head.appendChild(t));
      }
      function Pf(e) {
        return `[src="` + qt(e) + `"]`;
      }
      function Ff(e) {
        return `script[async]` + e;
      }
      function If(e, t, n) {
        if ((t.count++, t.instance === null))
          switch (t.type) {
            case `style`: {
              var r = e.querySelector(`style[data-href~="` + qt(n.href) + `"]`);
              if (r) return (t.instance = r), Ot(r), r;
              var a = h({}, n, {
                "data-href": n.href,
                "data-precedence": n.precedence,
                href: null,
                precedence: null,
              });
              return (
                (r = (e.ownerDocument || e).createElement(`style`)),
                Ot(r),
                Pd(r, `style`, a),
                Lf(r, n.precedence, e),
                (t.instance = r)
              );
            }
            case `stylesheet`: {
              a = Af(n.href);
              var o = e.querySelector(jf(a));
              if (o) return (t.state.loading |= 4), (t.instance = o), Ot(o), o;
              (r = Mf(n)),
                (a = mf.get(a)) && Rf(r, a),
                (o = (e.ownerDocument || e).createElement(`link`)),
                Ot(o);
              var s = o;
              return (
                (s._p = new Promise((e, t) => {
                  (s.onload = e), (s.onerror = t);
                })),
                Pd(o, `link`, r),
                (t.state.loading |= 4),
                Lf(o, n.precedence, e),
                (t.instance = o)
              );
            }
            case `script`:
              return (
                (o = Pf(n.src)),
                (a = e.querySelector(Ff(o)))
                  ? ((t.instance = a), Ot(a), a)
                  : ((r = n),
                    (a = mf.get(o)) && ((r = h({}, n)), zf(r, a)),
                    (e = e.ownerDocument || e),
                    (a = e.createElement(`script`)),
                    Ot(a),
                    Pd(a, `link`, r),
                    e.head.appendChild(a),
                    (t.instance = a))
              );
            case `void`:
              return null;
            default:
              throw Error(i(443, t.type));
          }
        else
          t.type === `stylesheet` &&
            !(t.state.loading & 4) &&
            ((r = t.instance), (t.state.loading |= 4), Lf(r, n.precedence, e));
        return t.instance;
      }
      function Lf(e, t, n) {
        for (
          var r = n.querySelectorAll(
              `link[rel="stylesheet"][data-precedence],style[data-precedence]`,
            ),
            i = r.length ? r[r.length - 1] : null,
            a = i,
            o = 0;
          o < r.length;
          o++
        ) {
          var s = r[o];
          if (s.dataset.precedence === t) a = s;
          else if (a !== i) break;
        }
        a
          ? a.parentNode.insertBefore(e, a.nextSibling)
          : ((t = n.nodeType === 9 ? n.head : n),
            t.insertBefore(e, t.firstChild));
      }
      function Rf(e, t) {
        (e.crossOrigin ??= t.crossOrigin),
          (e.referrerPolicy ??= t.referrerPolicy),
          (e.title ??= t.title);
      }
      function zf(e, t) {
        (e.crossOrigin ??= t.crossOrigin),
          (e.referrerPolicy ??= t.referrerPolicy),
          (e.integrity ??= t.integrity);
      }
      var Bf = null;
      function Vf(e, t, n) {
        if (Bf === null) {
          var r = new Map(),
            i = (Bf = new Map());
          i.set(n, r);
        } else (i = Bf), (r = i.get(n)), r || ((r = new Map()), i.set(n, r));
        if (r.has(e)) return r;
        for (
          r.set(e, null), n = n.getElementsByTagName(e), i = 0;
          i < n.length;
          i++
        ) {
          var a = n[i];
          if (
            !(
              a[St] ||
              a[ht] ||
              (e === `link` && a.getAttribute(`rel`) === `stylesheet`)
            ) &&
            a.namespaceURI !== `http://www.w3.org/2000/svg`
          ) {
            var o = a.getAttribute(t) || ``;
            o = e + o;
            var s = r.get(o);
            s ? s.push(a) : r.set(o, [a]);
          }
        }
        return r;
      }
      function Hf(e, t, n) {
        (e = e.ownerDocument || e),
          e.head.insertBefore(
            n,
            t === `title` ? e.querySelector(`head > title`) : null,
          );
      }
      function Uf(e, t, n) {
        if (n === 1 || t.itemProp != null) return !1;
        switch (e) {
          case `meta`:
          case `title`:
            return !0;
          case `style`:
            if (
              typeof t.precedence != `string` ||
              typeof t.href != `string` ||
              t.href === ``
            )
              break;
            return !0;
          case `link`:
            if (
              typeof t.rel != `string` ||
              typeof t.href != `string` ||
              t.href === `` ||
              t.onLoad ||
              t.onError
            )
              break;
            switch (t.rel) {
              case `stylesheet`:
                return (
                  (e = t.disabled), typeof t.precedence == `string` && e == null
                );
              default:
                return !0;
            }
          case `script`:
            if (
              t.async &&
              typeof t.async != `function` &&
              typeof t.async != `symbol` &&
              !t.onLoad &&
              !t.onError &&
              t.src &&
              typeof t.src == `string`
            )
              return !0;
        }
        return !1;
      }
      function Wf(e) {
        return !(e.type === `stylesheet` && !(e.state.loading & 3));
      }
      function Gf(e, t, n, r) {
        if (
          n.type === `stylesheet` &&
          (typeof r.media != `string` || !1 !== matchMedia(r.media).matches) &&
          !(n.state.loading & 4)
        ) {
          if (n.instance === null) {
            var i = Af(r.href),
              a = t.querySelector(jf(i));
            if (a) {
              (t = a._p),
                typeof t == `object` &&
                  t &&
                  typeof t.then == `function` &&
                  (e.count++, (e = Jf.bind(e)), t.then(e, e)),
                (n.state.loading |= 4),
                (n.instance = a),
                Ot(a);
              return;
            }
            (a = t.ownerDocument || t),
              (r = Mf(r)),
              (i = mf.get(i)) && Rf(r, i),
              (a = a.createElement(`link`)),
              Ot(a);
            var o = a;
            (o._p = new Promise((e, t) => {
              (o.onload = e), (o.onerror = t);
            })),
              Pd(a, `link`, r),
              (n.instance = a);
          }
          e.stylesheets === null && (e.stylesheets = new Map()),
            e.stylesheets.set(n, t),
            (t = n.state.preload) &&
              !(n.state.loading & 3) &&
              (e.count++,
              (n = Jf.bind(e)),
              t.addEventListener(`load`, n),
              t.addEventListener(`error`, n));
        }
      }
      var Kf = 0;
      function qf(e, t) {
        return (
          e.stylesheets && e.count === 0 && Xf(e, e.stylesheets),
          0 < e.count || 0 < e.imgCount
            ? (n) => {
                var r = setTimeout(() => {
                  if ((e.stylesheets && Xf(e, e.stylesheets), e.unsuspend)) {
                    var t = e.unsuspend;
                    (e.unsuspend = null), t();
                  }
                }, 6e4 + t);
                0 < e.imgBytes && Kf === 0 && (Kf = 62500 * Ld());
                var i = setTimeout(
                  () => {
                    if (
                      ((e.waitingForImages = !1),
                      e.count === 0 &&
                        (e.stylesheets && Xf(e, e.stylesheets), e.unsuspend))
                    ) {
                      var t = e.unsuspend;
                      (e.unsuspend = null), t();
                    }
                  },
                  (e.imgBytes > Kf ? 50 : 800) + t,
                );
                return (
                  (e.unsuspend = n),
                  () => {
                    (e.unsuspend = null), clearTimeout(r), clearTimeout(i);
                  }
                );
              }
            : null
        );
      }
      function Jf() {
        if (
          (this.count--,
          this.count === 0 && (this.imgCount === 0 || !this.waitingForImages))
        ) {
          if (this.stylesheets) Xf(this, this.stylesheets);
          else if (this.unsuspend) {
            var e = this.unsuspend;
            (this.unsuspend = null), e();
          }
        }
      }
      var Yf = null;
      function Xf(e, t) {
        (e.stylesheets = null),
          e.unsuspend !== null &&
            (e.count++,
            (Yf = new Map()),
            t.forEach(Zf, e),
            (Yf = null),
            Jf.call(e));
      }
      function Zf(e, t) {
        if (!(t.state.loading & 4)) {
          var n = Yf.get(e);
          if (n) var r = n.get(null);
          else {
            (n = new Map()), Yf.set(e, n);
            for (
              var i = e.querySelectorAll(
                  `link[data-precedence],style[data-precedence]`,
                ),
                a = 0;
              a < i.length;
              a++
            ) {
              var o = i[a];
              (o.nodeName === `LINK` ||
                o.getAttribute(`media`) !== `not all`) &&
                (n.set(o.dataset.precedence, o), (r = o));
            }
            r && n.set(null, r);
          }
          (i = t.instance),
            (o = i.getAttribute(`data-precedence`)),
            (a = n.get(o) || r),
            a === r && n.set(null, i),
            n.set(o, i),
            this.count++,
            (r = Jf.bind(this)),
            i.addEventListener(`load`, r),
            i.addEventListener(`error`, r),
            a
              ? a.parentNode.insertBefore(i, a.nextSibling)
              : ((e = e.nodeType === 9 ? e.head : e),
                e.insertBefore(i, e.firstChild)),
            (t.state.loading |= 4);
        }
      }
      var Qf = {
        $$typeof: te,
        Provider: null,
        Consumer: null,
        _currentValue: de,
        _currentValue2: de,
        _threadCount: 0,
      };
      function $f(e, t, n, r, i, a, o, s, c) {
        (this.tag = 1),
          (this.containerInfo = e),
          (this.pingCache = this.current = this.pendingChildren = null),
          (this.timeoutHandle = -1),
          (this.callbackNode =
            this.next =
            this.pendingContext =
            this.context =
            this.cancelPendingCommit =
              null),
          (this.callbackPriority = 0),
          (this.expirationTimes = it(-1)),
          (this.entangledLanes =
            this.shellSuspendCounter =
            this.errorRecoveryDisabledLanes =
            this.expiredLanes =
            this.warmLanes =
            this.pingedLanes =
            this.suspendedLanes =
            this.pendingLanes =
              0),
          (this.entanglements = it(0)),
          (this.hiddenUpdates = it(null)),
          (this.identifierPrefix = r),
          (this.onUncaughtError = i),
          (this.onCaughtError = a),
          (this.onRecoverableError = o),
          (this.pooledCache = null),
          (this.pooledCacheLanes = 0),
          (this.formState = c),
          (this.incompleteTransitions = new Map());
      }
      function ep(e, t, n, r, i, a, o, s, c, l, u, d) {
        return (
          (e = new $f(e, t, n, o, c, l, u, d, s)),
          (t = 1),
          !0 === a && (t |= 24),
          (a = fi(3, null, null, t)),
          (e.current = a),
          (a.stateNode = e),
          (t = da()),
          t.refCount++,
          (e.pooledCache = t),
          t.refCount++,
          (a.memoizedState = { element: r, isDehydrated: n, cache: t }),
          Wa(a),
          e
        );
      }
      function tp(e) {
        return e ? ((e = ui), e) : ui;
      }
      function np(e, t, n, r, i, a) {
        (i = tp(i)),
          r.context === null ? (r.context = i) : (r.pendingContext = i),
          (r = Ka(t)),
          (r.payload = { element: n }),
          (a = a === void 0 ? null : a),
          a !== null && (r.callback = a),
          (n = qa(e, r, t)),
          n !== null && (hu(n, e, t), Ja(n, e, t));
      }
      function rp(e, t) {
        if (((e = e.memoizedState), e !== null && e.dehydrated !== null)) {
          var n = e.retryLane;
          e.retryLane = n !== 0 && n < t ? n : t;
        }
      }
      function ip(e, t) {
        rp(e, t), (e = e.alternate) && rp(e, t);
      }
      function ap(e) {
        if (e.tag === 13 || e.tag === 31) {
          var t = si(e, 67108864);
          t !== null && hu(t, e, 67108864), ip(e, 67108864);
        }
      }
      function op(e) {
        if (e.tag === 13 || e.tag === 31) {
          var t = pu();
          t = ut(t);
          var n = si(e, t);
          n !== null && hu(n, e, t), ip(e, t);
        }
      }
      var sp = !0;
      function cp(e, t, n, r) {
        var i = T.T;
        T.T = null;
        var a = E.p;
        try {
          (E.p = 2), up(e, t, n, r);
        } finally {
          (E.p = a), (T.T = i);
        }
      }
      function lp(e, t, n, r) {
        var i = T.T;
        T.T = null;
        var a = E.p;
        try {
          (E.p = 8), up(e, t, n, r);
        } finally {
          (E.p = a), (T.T = i);
        }
      }
      function up(e, t, n, r) {
        if (sp) {
          var i = dp(r);
          if (i === null) wd(e, t, r, fp, n), Cp(e, r);
          else if (Tp(i, e, t, n, r)) r.stopPropagation();
          else if ((Cp(e, r), t & 4 && -1 < Sp.indexOf(e))) {
            for (; i !== null; ) {
              var a = Tt(i);
              if (a !== null)
                switch (a.tag) {
                  case 3:
                    if (
                      ((a = a.stateNode), a.current.memoizedState.isDehydrated)
                    ) {
                      var o = $e(a.pendingLanes);
                      if (o !== 0) {
                        var s = a;
                        for (s.pendingLanes |= 2, s.entangledLanes |= 2; o; ) {
                          var c = 1 << (31 - Ke(o));
                          (s.entanglements[1] |= c), (o &= ~c);
                        }
                        rd(a), !(K & 6) && ((tu = Pe() + 500), id(0, !1));
                      }
                    }
                    break;
                  case 31:
                  case 13:
                    (s = si(a, 2)), s !== null && hu(s, a, 2), bu(), ip(a, 2);
                }
              if (((a = dp(r)), a === null && wd(e, t, r, fp, n), a === i))
                break;
              i = a;
            }
            i !== null && r.stopPropagation();
          } else wd(e, t, r, null, n);
        }
      }
      function dp(e) {
        return (e = un(e)), pp(e);
      }
      var fp = null;
      function pp(e) {
        if (((fp = null), (e = wt(e)), e !== null)) {
          var t = o(e);
          if (t === null) e = null;
          else {
            var n = t.tag;
            if (n === 13) {
              if (((e = s(t)), e !== null)) return e;
              e = null;
            } else if (n === 31) {
              if (((e = c(t)), e !== null)) return e;
              e = null;
            } else if (n === 3) {
              if (t.stateNode.current.memoizedState.isDehydrated)
                return t.tag === 3 ? t.stateNode.containerInfo : null;
              e = null;
            } else t !== e && (e = null);
          }
        }
        return (fp = e), null;
      }
      function mp(e) {
        switch (e) {
          case `beforetoggle`:
          case `cancel`:
          case `click`:
          case `close`:
          case `contextmenu`:
          case `copy`:
          case `cut`:
          case `auxclick`:
          case `dblclick`:
          case `dragend`:
          case `dragstart`:
          case `drop`:
          case `focusin`:
          case `focusout`:
          case `input`:
          case `invalid`:
          case `keydown`:
          case `keypress`:
          case `keyup`:
          case `mousedown`:
          case `mouseup`:
          case `paste`:
          case `pause`:
          case `play`:
          case `pointercancel`:
          case `pointerdown`:
          case `pointerup`:
          case `ratechange`:
          case `reset`:
          case `resize`:
          case `seeked`:
          case `submit`:
          case `toggle`:
          case `touchcancel`:
          case `touchend`:
          case `touchstart`:
          case `volumechange`:
          case `change`:
          case `selectionchange`:
          case `textInput`:
          case `compositionstart`:
          case `compositionend`:
          case `compositionupdate`:
          case `beforeblur`:
          case `afterblur`:
          case `beforeinput`:
          case `blur`:
          case `fullscreenchange`:
          case `focus`:
          case `hashchange`:
          case `popstate`:
          case `select`:
          case `selectstart`:
            return 2;
          case `drag`:
          case `dragenter`:
          case `dragexit`:
          case `dragleave`:
          case `dragover`:
          case `mousemove`:
          case `mouseout`:
          case `mouseover`:
          case `pointermove`:
          case `pointerout`:
          case `pointerover`:
          case `scroll`:
          case `touchmove`:
          case `wheel`:
          case `mouseenter`:
          case `mouseleave`:
          case `pointerenter`:
          case `pointerleave`:
            return 8;
          case `message`:
            switch (Fe()) {
              case Ie:
                return 2;
              case Le:
                return 8;
              case Re:
              case ze:
                return 32;
              case Be:
                return 268435456;
              default:
                return 32;
            }
          default:
            return 32;
        }
      }
      var hp = !1,
        gp = null,
        _p = null,
        vp = null,
        yp = new Map(),
        bp = new Map(),
        xp = [],
        Sp =
          `mousedown mouseup touchcancel touchend touchstart auxclick dblclick pointercancel pointerdown pointerup dragend dragstart drop compositionend compositionstart keydown keypress keyup input textInput copy cut paste click change contextmenu reset`.split(
            ` `,
          );
      function Cp(e, t) {
        switch (e) {
          case `focusin`:
          case `focusout`:
            gp = null;
            break;
          case `dragenter`:
          case `dragleave`:
            _p = null;
            break;
          case `mouseover`:
          case `mouseout`:
            vp = null;
            break;
          case `pointerover`:
          case `pointerout`:
            yp.delete(t.pointerId);
            break;
          case `gotpointercapture`:
          case `lostpointercapture`:
            bp.delete(t.pointerId);
        }
      }
      function wp(e, t, n, r, i, a) {
        return e === null || e.nativeEvent !== a
          ? ((e = {
              blockedOn: t,
              domEventName: n,
              eventSystemFlags: r,
              nativeEvent: a,
              targetContainers: [i],
            }),
            t !== null && ((t = Tt(t)), t !== null && ap(t)),
            e)
          : ((e.eventSystemFlags |= r),
            (t = e.targetContainers),
            i !== null && t.indexOf(i) === -1 && t.push(i),
            e);
      }
      function Tp(e, t, n, r, i) {
        switch (t) {
          case `focusin`:
            return (gp = wp(gp, e, t, n, r, i)), !0;
          case `dragenter`:
            return (_p = wp(_p, e, t, n, r, i)), !0;
          case `mouseover`:
            return (vp = wp(vp, e, t, n, r, i)), !0;
          case `pointerover`: {
            var a = i.pointerId;
            return yp.set(a, wp(yp.get(a) || null, e, t, n, r, i)), !0;
          }
          case `gotpointercapture`:
            return (
              (a = i.pointerId),
              bp.set(a, wp(bp.get(a) || null, e, t, n, r, i)),
              !0
            );
        }
        return !1;
      }
      function Ep(e) {
        var t = wt(e.target);
        if (t !== null) {
          var n = o(t);
          if (n !== null) {
            if (((t = n.tag), t === 13)) {
              if (((t = s(n)), t !== null)) {
                (e.blockedOn = t),
                  pt(e.priority, () => {
                    op(n);
                  });
                return;
              }
            } else if (t === 31) {
              if (((t = c(n)), t !== null)) {
                (e.blockedOn = t),
                  pt(e.priority, () => {
                    op(n);
                  });
                return;
              }
            } else if (
              t === 3 &&
              n.stateNode.current.memoizedState.isDehydrated
            ) {
              e.blockedOn = n.tag === 3 ? n.stateNode.containerInfo : null;
              return;
            }
          }
        }
        e.blockedOn = null;
      }
      function Dp(e) {
        if (e.blockedOn !== null) return !1;
        for (var t = e.targetContainers; 0 < t.length; ) {
          var n = dp(e.nativeEvent);
          if (n === null) {
            n = e.nativeEvent;
            var r = new n.constructor(n.type, n);
            (ln = r), n.target.dispatchEvent(r), (ln = null);
          } else return (t = Tt(n)), t !== null && ap(t), (e.blockedOn = n), !1;
          t.shift();
        }
        return !0;
      }
      function Op(e, t, n) {
        Dp(e) && n.delete(t);
      }
      function kp() {
        (hp = !1),
          gp !== null && Dp(gp) && (gp = null),
          _p !== null && Dp(_p) && (_p = null),
          vp !== null && Dp(vp) && (vp = null),
          yp.forEach(Op),
          bp.forEach(Op);
      }
      function Ap(e, n) {
        e.blockedOn === n &&
          ((e.blockedOn = null),
          hp ||
            ((hp = !0),
            t.unstable_scheduleCallback(t.unstable_NormalPriority, kp)));
      }
      var jp = null;
      function Mp(e) {
        jp !== e &&
          ((jp = e),
          t.unstable_scheduleCallback(t.unstable_NormalPriority, () => {
            jp === e && (jp = null);
            for (var t = 0; t < e.length; t += 3) {
              var n = e[t],
                r = e[t + 1],
                i = e[t + 2];
              if (typeof r != `function`) {
                if (pp(r || n) === null) continue;
                break;
              }
              var a = Tt(n);
              a !== null &&
                (e.splice(t, 3),
                (t -= 3),
                Os(
                  a,
                  { pending: !0, data: i, method: n.method, action: r },
                  r,
                  i,
                ));
            }
          }));
      }
      function Np(e) {
        function t(t) {
          return Ap(t, e);
        }
        gp !== null && Ap(gp, e),
          _p !== null && Ap(_p, e),
          vp !== null && Ap(vp, e),
          yp.forEach(t),
          bp.forEach(t);
        for (var n = 0; n < xp.length; n++) {
          var r = xp[n];
          r.blockedOn === e && (r.blockedOn = null);
        }
        for (; 0 < xp.length && ((n = xp[0]), n.blockedOn === null); )
          Ep(n), n.blockedOn === null && xp.shift();
        if (((n = (e.ownerDocument || e).$$reactFormReplay), n != null))
          for (r = 0; r < n.length; r += 3) {
            var i = n[r],
              a = n[r + 1],
              o = i[gt] || null;
            if (typeof a == `function`) o || Mp(n);
            else if (o) {
              var s = null;
              if (a && a.hasAttribute(`formAction`)) {
                if (((i = a), (o = a[gt] || null))) s = o.formAction;
                else if (pp(i) !== null) continue;
              } else s = o.action;
              typeof s == `function`
                ? (n[r + 1] = s)
                : (n.splice(r, 3), (r -= 3)),
                Mp(n);
            }
          }
      }
      function Pp() {
        function e(e) {
          e.canIntercept &&
            e.info === `react-transition` &&
            e.intercept({
              handler: () => new Promise((e) => (i = e)),
              focusReset: `manual`,
              scroll: `manual`,
            });
        }
        function t() {
          i !== null && (i(), (i = null)), r || setTimeout(n, 20);
        }
        function n() {
          if (!r && !navigation.transition) {
            var e = navigation.currentEntry;
            e &&
              e.url != null &&
              navigation.navigate(e.url, {
                state: e.getState(),
                info: `react-transition`,
                history: `replace`,
              });
          }
        }
        if (typeof navigation == `object`) {
          var r = !1,
            i = null;
          return (
            navigation.addEventListener(`navigate`, e),
            navigation.addEventListener(`navigatesuccess`, t),
            navigation.addEventListener(`navigateerror`, t),
            setTimeout(n, 100),
            () => {
              (r = !0),
                navigation.removeEventListener(`navigate`, e),
                navigation.removeEventListener(`navigatesuccess`, t),
                navigation.removeEventListener(`navigateerror`, t),
                i !== null && (i(), (i = null));
            }
          );
        }
      }
      function Fp(e) {
        this._internalRoot = e;
      }
      (Ip.prototype.render = Fp.prototype.render =
        function (e) {
          var t = this._internalRoot;
          if (t === null) throw Error(i(409));
          var n = t.current;
          np(n, pu(), e, t, null, null);
        }),
        (Ip.prototype.unmount = Fp.prototype.unmount =
          function () {
            var e = this._internalRoot;
            if (e !== null) {
              this._internalRoot = null;
              var t = e.containerInfo;
              np(e.current, 2, null, e, null, null), bu(), (t[_t] = null);
            }
          });
      function Ip(e) {
        this._internalRoot = e;
      }
      Ip.prototype.unstable_scheduleHydration = (e) => {
        if (e) {
          var t = ft();
          e = { blockedOn: null, target: e, priority: t };
          for (var n = 0; n < xp.length && t !== 0 && t < xp[n].priority; n++);
          xp.splice(n, 0, e), n === 0 && Ep(e);
        }
      };
      var Lp = n.version;
      if (Lp !== `19.2.7`) throw Error(i(527, Lp, `19.2.7`));
      E.findDOMNode = (e) => {
        var t = e._reactInternals;
        if (t === void 0)
          throw typeof e.render == `function`
            ? Error(i(188))
            : ((e = Object.keys(e).join(`,`)), Error(i(268, e)));
        return (
          (e = d(t)),
          (e = e === null ? null : p(e)),
          (e = e === null ? null : e.stateNode),
          e
        );
      };
      var Rp = {
        bundleType: 0,
        version: `19.2.7`,
        rendererPackageName: `react-dom`,
        currentDispatcherRef: T,
        reconcilerVersion: `19.2.7`,
      };
      if (typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ < `u`) {
        var zp = __REACT_DEVTOOLS_GLOBAL_HOOK__;
        if (!zp.isDisabled && zp.supportsFiber)
          try {
            (Ue = zp.inject(Rp)), (We = zp);
          } catch {}
      }
      e.createRoot = (e, t) => {
        if (!a(e)) throw Error(i(299));
        var n = !1,
          r = ``,
          o = Xs,
          s = Zs,
          c = Qs;
        return (
          t != null &&
            (!0 === t.unstable_strictMode && (n = !0),
            t.identifierPrefix !== void 0 && (r = t.identifierPrefix),
            t.onUncaughtError !== void 0 && (o = t.onUncaughtError),
            t.onCaughtError !== void 0 && (s = t.onCaughtError),
            t.onRecoverableError !== void 0 && (c = t.onRecoverableError)),
          (t = ep(e, 1, !1, null, null, n, r, null, o, s, c, Pp)),
          (e[_t] = t.current),
          Sd(e),
          new Fp(t)
        );
      };
    }),
    g = o((e, t) => {
      function n() {
        if (
          !(
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__ > `u` ||
            typeof __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE != `function`
          )
        )
          try {
            __REACT_DEVTOOLS_GLOBAL_HOOK__.checkDCE(n);
          } catch (e) {
            console.error(e);
          }
      }
      n(), (t.exports = h());
    })(),
    _ = {
      debug: (...e) => ([...e], void 0),
      log: (...e) => ([...e], void 0),
      warn: (...e) => ([...e], void 0),
      error: (...e) => ([...e], void 0),
    },
    v = Symbol(`null`),
    y = 0,
    b = class extends Map {
      constructor(...e) {
        super(),
          (this._objectHashes = new WeakMap()),
          (this._symbolHashes = new Map()),
          (this._publicKeys = new Map());
        const [t] = e;
        if (t != null) {
          if (typeof t[Symbol.iterator] != `function`)
            throw TypeError(
              typeof t +
                ` is not iterable (cannot read property Symbol(Symbol.iterator))`,
            );
          for (const [e, n] of t) this.set(e, n);
        }
      }
      _getPublicKeys(e, t = !1) {
        if (!Array.isArray(e))
          throw TypeError(`The keys parameter must be an array`);
        let n = this._getPrivateKey(e, t),
          r;
        return (
          n && this._publicKeys.has(n)
            ? (r = this._publicKeys.get(n))
            : t && ((r = [...e]), this._publicKeys.set(n, r)),
          { privateKey: n, publicKey: r }
        );
      }
      _getPrivateKey(e, t = !1) {
        const n = [];
        for (const r of e) {
          let e = r === null ? v : r,
            i;
          if (
            ((i =
              typeof e == `object` || typeof e == `function`
                ? `_objectHashes`
                : typeof e == `symbol` && `_symbolHashes`),
            !i)
          )
            n.push(e);
          else if (this[i].has(e)) n.push(this[i].get(e));
          else if (t) {
            const t = `@@mkm-ref-${y++}@@`;
            this[i].set(e, t), n.push(t);
          } else return !1;
        }
        return JSON.stringify(n);
      }
      set(e, t) {
        const { publicKey: n } = this._getPublicKeys(e, !0);
        return super.set(n, t);
      }
      get(e) {
        const { publicKey: t } = this._getPublicKeys(e);
        return super.get(t);
      }
      has(e) {
        const { publicKey: t } = this._getPublicKeys(e);
        return super.has(t);
      }
      delete(e) {
        const { publicKey: t, privateKey: n } = this._getPublicKeys(e);
        return !!(t && super.delete(t) && this._publicKeys.delete(n));
      }
      clear() {
        super.clear(), this._symbolHashes.clear(), this._publicKeys.clear();
      }
      get [Symbol.toStringTag]() {
        return `ManyKeysMap`;
      }
      get size() {
        return super.size;
      }
    };
  function x(e) {
    if (typeof e != `object` || !e) return !1;
    const t = Object.getPrototypeOf(e);
    return (t !== null &&
      t !== Object.prototype &&
      Object.getPrototypeOf(t) !== null) ||
      Symbol.iterator in e
      ? !1
      : Symbol.toStringTag in e
        ? Object.prototype.toString.call(e) === `[object Module]`
        : !0;
  }
  function ee(e, t, n = `.`, r) {
    if (!x(t)) return ee(e, {}, n, r);
    const i = { ...t };
    for (const t of Object.keys(e)) {
      if (t === `__proto__` || t === `constructor`) continue;
      const a = e[t];
      a != null &&
        ((r && r(i, t, a, n)) ||
          (Array.isArray(a) && Array.isArray(i[t])
            ? (i[t] = [...a, ...i[t]])
            : x(a) && x(i[t])
              ? (i[t] = ee(a, i[t], (n ? `${n}.` : ``) + t.toString(), r))
              : (i[t] = a)));
    }
    return i;
  }
  function te(e) {
    return (...t) => t.reduce((t, n) => ee(t, n, ``, e), {});
  }
  var S = te(),
    ne = (e) =>
      e === null ? { isDetected: !1 } : { isDetected: !0, result: e },
    re = (e) =>
      e === null ? { isDetected: !0, result: null } : { isDetected: !1 },
    ie = () => ({
      target: globalThis.document,
      unifyProcess: !0,
      detector: ne,
      observeConfigs: { childList: !0, subtree: !0, attributes: !0 },
      signal: void 0,
      customMatcher: void 0,
    }),
    ae = (e, t) => S(e, t),
    oe = new b();
  function se(e) {
    const { defaultOptions: t } = e;
    return (e, n) => {
      const {
          target: r,
          unifyProcess: i,
          observeConfigs: a,
          detector: o,
          signal: s,
          customMatcher: c,
        } = ae(n, t),
        l = [e, r, i, a, o, s, c],
        u = oe.get(l);
      if (i && u) return u;
      const d = new Promise(async (t, n) => {
        if (s?.aborted) return n(s.reason);
        const i = new MutationObserver(async (n) => {
          for (const a of n) {
            if (s?.aborted) {
              i.disconnect();
              break;
            }
            const n = await ce({
              selector: e,
              target: r,
              detector: o,
              customMatcher: c,
            });
            if (n.isDetected) {
              i.disconnect(), t(n.result);
              break;
            }
          }
        });
        s?.addEventListener(`abort`, () => (i.disconnect(), n(s.reason)), {
          once: !0,
        });
        const l = await ce({
          selector: e,
          target: r,
          detector: o,
          customMatcher: c,
        });
        if (l.isDetected) return t(l.result);
        i.observe(r, a);
      }).finally(() => {
        oe.delete(l);
      });
      return oe.set(l, d), d;
    };
  }
  async function ce({ target: e, selector: t, detector: n, customMatcher: r }) {
    return await n(r ? r(t) : e.querySelector(t));
  }
  var C = se({ defaultOptions: ie() });
  function le(e, t, n) {
    n.position !== `inline` &&
      (n.zIndex != null && (e.style.zIndex = String(n.zIndex)),
      (e.style.overflow = `visible`),
      (e.style.position = `relative`),
      (e.style.width = `0`),
      (e.style.height = `0`),
      (e.style.display = `block`),
      t &&
        (n.position === `overlay`
          ? ((t.style.position = `absolute`),
            n.alignment?.startsWith(`bottom-`)
              ? (t.style.bottom = `0`)
              : (t.style.top = `0`),
            n.alignment?.endsWith(`-right`)
              ? (t.style.right = `0`)
              : (t.style.left = `0`))
          : ((t.style.position = `fixed`),
            (t.style.top = `0`),
            (t.style.bottom = `0`),
            (t.style.left = `0`),
            (t.style.right = `0`))));
  }
  function w(e) {
    if (e.anchor == null) return document.body;
    const t = typeof e.anchor == `function` ? e.anchor() : e.anchor;
    return typeof t == `string`
      ? t.startsWith(`/`)
        ? (document.evaluate(
            t,
            document,
            null,
            XPathResult.FIRST_ORDERED_NODE_TYPE,
            null,
          ).singleNodeValue ?? void 0)
        : (document.querySelector(t) ?? void 0)
      : (t ?? void 0);
  }
  function ue(e, t) {
    const n = w(t);
    if (n == null)
      throw Error(
        `Failed to mount content script UI: could not find anchor element`,
      );
    switch (t.append) {
      case void 0:
      case `last`:
        n.append(e);
        break;
      case `first`:
        n.prepend(e);
        break;
      case `replace`:
        n.replaceWith(e);
        break;
      case `after`:
        n.parentElement?.insertBefore(e, n.nextElementSibling);
        break;
      case `before`:
        n.parentElement?.insertBefore(e, n);
        break;
      default:
        t.append(n, e);
    }
  }
  function T(e, t) {
    let n,
      r = () => {
        n?.stopAutoMount(), (n = void 0);
      },
      i = () => {
        e.mount();
      },
      a = e.remove;
    return {
      mount: i,
      remove: () => {
        r(), e.remove();
      },
      autoMount: (e) => {
        n && _.warn(`autoMount is already set.`),
          (n = E({ mount: i, unmount: a, stopAutoMount: r }, { ...t, ...e }));
      },
    };
  }
  function E(e, t) {
    const n = new AbortController(),
      r = `explicit_stop_auto_mount`,
      i = () => {
        n.abort(r), t.onStop?.();
      },
      a = typeof t.anchor == `function` ? t.anchor() : t.anchor;
    if (a instanceof Element)
      throw Error(
        "autoMount and Element anchor option cannot be combined. Avoid passing `Element` directly or `() => Element` to the anchor.",
      );
    async function o(i) {
      let a = !!w(t);
      for (a && e.mount(); !n.signal.aborted; )
        try {
          (a = !!(await C(i ?? `body`, {
            customMatcher: () => w(t) ?? null,
            detector: a ? re : ne,
            signal: n.signal,
          }))),
            a ? e.mount() : (e.unmount(), t.once && e.stopAutoMount());
        } catch (e) {
          if (n.signal.aborted && n.signal.reason === r) break;
          throw e;
        }
    }
    return o(a), { stopAutoMount: i };
  }
  var de = /(\s*@(property|font-face)[\s\S]*?{[\s\S]*?})/gm;
  function fe(e) {
    return {
      documentCss: Array.from(e.matchAll(de), (e) => e[0])
        .join(``)
        .trim(),
      shadowCss: e.replace(de, ``).trim(),
    };
  }
  var pe = globalThis.browser?.runtime?.id
      ? globalThis.browser
      : globalThis.chrome,
    me = c(
      o((e, t) => {
        var n =
          /^[a-z](?:[.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*-(?:[\x2D.0-9_a-z\xB7\xC0-\xD6\xD8-\xF6\xF8-\u037D\u037F-\u1FFF\u200C\u200D\u203F\u2040\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD]|[\uD800-\uDB7F][\uDC00-\uDFFF])*$/;
        t.exports = (e) => n.test(e);
      })(),
      1,
    ),
    he = (e, t, n) =>
      new Promise((r, i) => {
        var a = (e) => {
            try {
              s(n.next(e));
            } catch (e) {
              i(e);
            }
          },
          o = (e) => {
            try {
              s(n.throw(e));
            } catch (e) {
              i(e);
            }
          },
          s = (e) =>
            e.done ? r(e.value) : Promise.resolve(e.value).then(a, o);
        s((n = n.apply(e, t)).next());
      }),
    D = [
      `article`,
      `aside`,
      `blockquote`,
      `body`,
      `div`,
      `footer`,
      `h1`,
      `h2`,
      `h3`,
      `h4`,
      `h5`,
      `h6`,
      `header`,
      `main`,
      `nav`,
      `p`,
      `section`,
      `span`,
    ];
  function ge(e) {
    return he(this, null, function* () {
      const { name: t, mode: n = `closed`, css: r, isolateEvents: i = !1 } = e;
      if (!D.includes(t) && !(0, me.default)(t))
        throw Error(
          `"${t}" cannot have a shadow root attached to it. It must be two words and kebab-case, with a few exceptions. See https://developer.mozilla.org/en-US/docs/Web/API/Element/attachShadow#elements_you_can_attach_a_shadow_to`,
        );
      const a = document.createElement(t),
        o = a.attachShadow({ mode: n }),
        s = document.createElement(`html`),
        c = document.createElement(`body`),
        l = document.createElement(`head`);
      if (r) {
        const e = document.createElement(`style`);
        `url` in r
          ? (e.textContent = yield fetch(r.url).then((e) => e.text()))
          : (e.textContent = r.textContent),
          l.appendChild(e);
      }
      return (
        s.appendChild(l),
        s.appendChild(c),
        o.appendChild(s),
        i &&
          (Array.isArray(i) ? i : [`keydown`, `keyup`, `keypress`]).forEach(
            (e) => {
              c.addEventListener(e, (e) => e.stopPropagation());
            },
          ),
        { parentElement: a, shadow: o, isolatedElement: c }
      );
    });
  }
  async function _e(e, t) {
    const n = Math.random().toString(36).substring(2, 15),
      r = [];
    if (
      (t.inheritStyles ||
        r.push(`/* WXT Shadow Root Reset */ :host{all:initial !important;}`),
      t.css && r.push(t.css),
      e.options?.cssInjectionMode === `ui`)
    ) {
      const e = await ve();
      r.push(e.replaceAll(`:root`, `:host`));
    }
    let { shadowCss: i, documentCss: a } = fe(
        r
          .join(`
`)
          .trim(),
      ),
      {
        isolatedElement: o,
        parentElement: s,
        shadow: c,
      } = await ge({
        name: t.name,
        css: { textContent: i },
        mode: t.mode ?? `open`,
        isolateEvents: t.isolateEvents,
      }),
      l,
      u = () => {
        if (
          (ue(s, t),
          le(s, c.querySelector(`html`), t),
          a &&
            !document.querySelector(
              `style[wxt-shadow-root-document-styles="${n}"]`,
            ))
        ) {
          const e = document.createElement(`style`);
          (e.textContent = a),
            e.setAttribute(`wxt-shadow-root-document-styles`, n),
            (document.head ?? document.body).append(e);
        }
        l = t.onMount(o, c, s);
      },
      d = () => {
        for (
          t.onRemove?.(l),
            s.remove(),
            document
              .querySelector(`style[wxt-shadow-root-document-styles="${n}"]`)
              ?.remove();
          o.lastChild;
        )
          o.removeChild(o.lastChild);
        l = void 0;
      },
      f = T({ mount: u, remove: d }, t);
    return (
      e.onInvalidated(d),
      {
        shadow: c,
        shadowHost: s,
        uiContainer: o,
        ...f,
        get mounted() {
          return l;
        },
      }
    );
  }
  async function ve() {
    const e = pe.runtime.getURL(`/content-scripts/firefly.css`);
    try {
      return await (await fetch(e)).text();
    } catch (t) {
      return (
        _.warn(
          `Failed to load styles @ ${e}. Did you forget to import the stylesheet in your entrypoint?`,
          t,
        ),
        ``
      );
    }
  }
  function ye(e) {
    return e;
  }
  var O = f();
  function be(e) {
    return {
      words: e.filter((e) => e.expected.trim().length > 0),
      index: 0,
      typed: ``,
      wordErrors: 0,
      totalErrors: 0,
      results: [],
      completed: e.length === 0,
    };
  }
  function xe(e, t) {
    if (e.completed) return { state: e, rejected: !1, advanced: !1 };
    const n = we(e.words[e.index]?.expected ?? ``),
      r = we(t);
    return r === n
      ? { state: Ce(e, !1), rejected: !1, advanced: !0 }
      : n.startsWith(r)
        ? { state: { ...e, typed: t }, rejected: !1, advanced: !1 }
        : {
            state: {
              ...e,
              wordErrors: e.wordErrors + 1,
              totalErrors: e.totalErrors + 1,
            },
            rejected: !0,
            advanced: !1,
          };
  }
  function Se(e) {
    return e.completed ? e : Ce(e, !0);
  }
  function Ce(e, t) {
    const n = e.words[e.index]?.expected ?? ``,
      r = [...e.results, { expected: n, errors: e.wordErrors, skipped: t }],
      i = e.index + 1;
    return {
      ...e,
      index: i,
      typed: ``,
      wordErrors: 0,
      results: r,
      completed: i >= e.words.length,
    };
  }
  function we(e) {
    return e.normalize(`NFKC`).toLocaleLowerCase(`en-AU`);
  }
  var Te = { play: `p`, restart: `r`, next: `j`, previous: `k`, mark: `m` };
  function Ee(e, t) {
    if (
      e.key.toLocaleLowerCase(`en-AU`) === `p` &&
      e.altKey &&
      e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey
    )
      return {
        action: e.repeat || e.isComposing ? null : `toggle-overlay`,
        consume: !0,
      };
    if (!t.overlayOpen || e.isComposing || e.ctrlKey || e.metaKey)
      return { action: null, consume: !1 };
    const n = { ...Te, ...t.keymap };
    if (t.phase === `COMMAND` && t.editingCommandField && e.key !== `Escape`)
      return { action: null, consume: !1 };
    const r = De(e, t, n);
    return e.repeat && r.action ? { action: null, consume: !0 } : r;
  }
  function De(e, t, n) {
    const r = e.key.toLocaleLowerCase(`en-AU`);
    if (t.phase === `ANSWERING`) {
      if (Ae(e) && e.key === `Enter`) return k(`submit`);
      if (Ae(e) && e.key === `Escape`) return k(`open-command`);
      if (je(e)) {
        for (const e of Object.keys(Te))
          if (r === n[e]?.toLocaleLowerCase(`en-AU`)) return k(e);
      }
      return { action: null, consume: !1 };
    }
    if (t.phase === `REVIEW`) {
      if (!Ae(e)) return { action: null, consume: !1 };
      const n =
        e.key === `Enter` || r === `j`
          ? `next`
          : r === `k`
            ? `previous`
            : e.code === `Space`
              ? `play`
              : r === `r`
                ? `restart`
                : r === `t`
                  ? `redo`
                  : r === `m`
                    ? `mark`
                    : e.key === `Escape`
                      ? `open-command`
                      : null;
      return n
        ? t.enterReleased && t.nowMs >= t.reviewReadyAtMs
          ? k(n)
          : { action: null, consume: !0 }
        : { action: null, consume: !1 };
    }
    if (t.phase === `COMMAND`)
      return !Ae(e) && !(e.key === `?` && e.shiftKey)
        ? { action: null, consume: !1 }
        : e.key === `Escape`
          ? k(`close-command`)
          : r === `p`
            ? k(`play`)
            : r === `r`
              ? k(`restart`)
              : r === `j`
                ? k(`next`)
                : r === `k`
                  ? k(`previous`)
                  : r === `m`
                    ? k(`mark`)
                    : r === `e`
                      ? k(`toggle-mode`)
                      : r === `q`
                        ? k(`ranked-review`)
                        : r === `w`
                          ? k(`word-library`)
                          : r === `s`
                            ? k(`settings`)
                            : r === `b`
                              ? k(`build-index`)
                              : r === `i`
                                ? k(`focus-input`)
                                : e.key === `?`
                                  ? k(`help`)
                                  : { action: null, consume: !1 };
    if (t.phase === `NAVIGATING`) {
      if (!Ae(e)) return { action: null, consume: !1 };
      if (t.indexStatus === `INDEXING`) {
        if (e.key === `Escape`) return k(`pause-index`);
        if (r === `x`) return k(`cancel-index`);
      }
      if (t.indexStatus === `PAUSED`) {
        if (e.key === `Enter` || r === `r`) return k(`resume-index`);
        if (r === `x`) return k(`cancel-index`);
      }
      return { action: null, consume: !1 };
    }
    if (t.phase === `DESYNC` && je(e)) {
      if (r === n.next?.toLocaleLowerCase(`en-AU`)) return k(`next`);
      if (r === n.previous?.toLocaleLowerCase(`en-AU`)) return k(`previous`);
    }
    if (new Set([`AUTH_REQUIRED`, `DESYNC`, `SITE_CHANGED`]).has(t.phase)) {
      if (!Ae(e) && !(e.key === `?` && e.shiftKey))
        return { action: null, consume: !1 };
      if (r === `r`) return k(`retry`);
      if (r === `o`) return k(`original-site`);
      if (e.key === `?`) return k(`help`);
    }
    return { action: null, consume: !1 };
  }
  function Oe(e) {
    const t = new Map();
    for (const [n, r] of Object.entries(e)) {
      const e = r.trim().toLocaleLowerCase(`en-AU`);
      if (!e) continue;
      const i = t.get(e) ?? [];
      i.push(n), t.set(e, i);
    }
    return [...t.values()].filter((e) => e.length > 1);
  }
  function ke(e) {
    return (
      Object.values(e).every((e) => /^[a-z]$/iu.test(e.trim())) &&
      Oe(e).length === 0
    );
  }
  function k(e) {
    return { action: e, consume: !0 };
  }
  function Ae(e) {
    return !e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey;
  }
  function je(e) {
    return e.altKey && !e.shiftKey && !e.ctrlKey && !e.metaKey;
  }
  var Me = `data-pte-pilot-isolated`,
    Ne = `data-pte-pilot-cockpit-open`,
    Pe = `pte-pilot-site-overlay-suppression`,
    Fe = `
html[${Ne}] .el-dialog__wrapper.ai-score,
html[${Ne}] .v-modal {
  z-index: 0 !important;
}
`;
  function Ie() {
    if (document.getElementById(Pe)) return;
    const e = document.createElement(`style`);
    (e.id = Pe), (e.textContent = Fe), document.head.append(e);
  }
  var Le = class {
    #e = [];
    #t = new Map();
    #n = null;
    #r = null;
    #i = !1;
    enable(e) {
      if (this.#i) return;
      (this.#i = !0),
        Ie(),
        document.documentElement.setAttribute(Ne, ``),
        (this.#n =
          document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null);
      const t =
        e.getRootNode() instanceof ShadowRoot ? e.getRootNode().host : e;
      for (const e of Array.from(document.body.children))
        e instanceof HTMLElement && this.isolate(e, t);
      (this.#r = new MutationObserver((e) => {
        if (this.#i)
          for (const n of e) {
            n.type === `attributes` &&
              n.target instanceof HTMLElement &&
              n.target.parentElement === document.body &&
              this.isolate(n.target, t);
            for (const e of n.addedNodes)
              e instanceof HTMLElement &&
                e.parentElement === document.body &&
                this.isolate(e, t);
          }
      })),
        this.#r.observe(document.body, {
          childList: !0,
          subtree: !0,
          attributes: !0,
          attributeFilter: [`inert`, `aria-hidden`, Me],
        });
    }
    disable() {
      if (this.#i) {
        (this.#i = !1),
          document.documentElement.removeAttribute(Ne),
          this.#r?.disconnect(),
          (this.#r = null);
        for (const e of this.#e)
          (e.element.inert = e.inert),
            e.ariaHidden === null
              ? e.element.removeAttribute(`aria-hidden`)
              : e.element.setAttribute(`aria-hidden`, e.ariaHidden),
            e.isolationMarker === null
              ? e.element.removeAttribute(Me)
              : e.element.setAttribute(Me, e.isolationMarker);
        (this.#e = []),
          this.#t.clear(),
          this.#n?.focus({ preventScroll: !0 }),
          (this.#n = null);
      }
    }
    isolate(e, t) {
      if (e === t || e.contains(t)) return;
      let n = this.#t.get(e);
      n ||
        ((n = {
          element: e,
          inert: e.inert,
          ariaHidden: e.getAttribute(`aria-hidden`),
          isolationMarker: e.getAttribute(Me),
        }),
        this.#t.set(e, n),
        this.#e.push(n)),
        (e.inert ||= !0),
        e.getAttribute(`aria-hidden`) !== `true` &&
          e.setAttribute(`aria-hidden`, `true`),
        n.ariaHidden === `true`
          ? n.isolationMarker === null
            ? e.removeAttribute(Me)
            : e.getAttribute(`data-pte-pilot-isolated`) !== n.isolationMarker &&
              e.setAttribute(Me, n.isolationMarker)
          : e.getAttribute(`data-pte-pilot-isolated`) !== `aria-added` &&
            e.setAttribute(Me, `aria-added`);
    }
  };
  function Re(e, t) {
    if (e.key !== `Tab`) return;
    const n = Array.from(
      t.querySelectorAll(
        `button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])`,
      ),
    ).filter((e) => !e.hidden && e.getAttribute(`aria-hidden`) !== `true`);
    if (n.length === 0) return;
    const r = n[0],
      i = n.at(-1);
    if (!r || !i) return;
    const a = t.getRootNode(),
      o = a instanceof ShadowRoot ? a.activeElement : document.activeElement;
    e.shiftKey && o === r
      ? (e.preventDefault(), i.focus())
      : !e.shiftKey && o === i && (e.preventDefault(), r.focus());
  }
  function ze(e) {
    return e
      .normalize(`NFKC`)
      .replace(/[’]/gu, `'`)
      .replace(/[^\p{L}\p{N}']+/gu, ` `)
      .trim()
      .split(/\s+/u)
      .filter(Boolean);
  }
  var Be = (e) => e.toLocaleLowerCase(`en-AU`);
  function Ve(e, t) {
    const n = Array.from({ length: t.length + 1 }, (e, t) => t),
      r = Array(t.length + 1).fill(0);
    for (let i = 1; i <= e.length; i += 1) {
      r[0] = i;
      for (let a = 1; a <= t.length; a += 1) {
        const o = e[i - 1] === t[a - 1] ? 0 : 1;
        r[a] = Math.min(
          (n[a] ?? 0) + 1,
          (r[a - 1] ?? 0) + 1,
          (n[a - 1] ?? 0) + o,
        );
      }
      for (let e = 0; e <= t.length; e += 1) n[e] = r[e] ?? 0;
    }
    return n[t.length] ?? 0;
  }
  function He(e) {
    const t = Be(e);
    for (const e of [`ing`, `ied`, `ed`, `es`, `s`])
      if (!(t.length - e.length < 3 || !t.endsWith(e)))
        return e === `ied`
          ? `${t.slice(0, -e.length)}y`
          : t.slice(0, -e.length);
    return t;
  }
  function Ue(e, t) {
    if (He(e) === He(t)) return `word_form`;
    const n = Be(e),
      r = Be(t);
    return Ve(n, r) <=
      Math.max(1, Math.floor(Math.max(n.length, r.length) * 0.25))
      ? `spelling`
      : `substitution`;
  }
  function We(e, t) {
    if (e.length !== t.length) return !1;
    const n = e.map(Be).sort(),
      r = t.map(Be).sort();
    return n.every((e, t) => e === r[t]);
  }
  function Ge(e, t) {
    const n = Array.from({ length: e.length + 1 }, () =>
      Array(t.length + 1).fill(0),
    );
    for (let r = e.length - 1; r >= 0; --r)
      for (let i = t.length - 1; i >= 0; --i) {
        const a = n[r];
        a &&
          (a[i] =
            Be(e[r] ?? ``) === Be(t[i] ?? ``)
              ? (n[r + 1]?.[i + 1] ?? 0) + 1
              : Math.max(n[r + 1]?.[i] ?? 0, a[i + 1] ?? 0));
      }
    let r = [],
      i = 0,
      a = 0;
    for (; i < e.length && a < t.length; )
      Be(e[i] ?? ``) === Be(t[a] ?? ``)
        ? (r.push([i, a]), (i += 1), (a += 1))
        : (n[i + 1]?.[a] ?? 0) >= (n[i]?.[a + 1] ?? 0)
          ? (i += 1)
          : (a += 1);
    return r;
  }
  function Ke(e, t, n) {
    const r = Math.max(t, n);
    return r === 0 ? 1 : e / r;
  }
  function qe(e, t) {
    const n = ze(e),
      r = ze(t);
    if (We(n, r)) {
      const e = [],
        t = [];
      n.forEach((n, i) => {
        const a = r[i] ?? ``;
        if (Be(n) === Be(a)) {
          t.push({ kind: `correct`, text: n });
          return;
        }
        e.push({ expected: n, actual: a, type: `order` }),
          t.push({ kind: `omit`, text: n }),
          t.push({ kind: `error`, text: a });
      });
      const i = n.length - e.length;
      return {
        expectedTokens: n,
        actualTokens: r,
        correctCount: i,
        accuracy: Ke(i, n.length, r.length),
        errors: e,
        segments: t,
      };
    }
    let i = Ge(n, r),
      a = [],
      o = [],
      s = 0,
      c = 0,
      l = [...i, [n.length, r.length]];
    for (const [e, t] of l) {
      const i = n.slice(s, e),
        l = r.slice(c, t),
        u = Math.min(i.length, l.length);
      for (let e = 0; e < u; e += 1) {
        const t = i[e],
          n = l[e];
        t !== void 0 &&
          n !== void 0 &&
          (a.push({ expected: t, actual: n, type: Ue(t, n) }),
          o.push({ kind: `omit`, text: t }),
          o.push({ kind: `error`, text: n }));
      }
      for (const e of i.slice(u))
        a.push({ expected: e, actual: ``, type: `missing` }),
          o.push({ kind: `omit`, text: e });
      for (const e of l.slice(u))
        a.push({ expected: ``, actual: e, type: `extra` }),
          o.push({ kind: `error`, text: e });
      const d = n[e];
      d !== void 0 && e < n.length && o.push({ kind: `correct`, text: d }),
        (s = e + 1),
        (c = t + 1);
    }
    const u = i.length;
    return {
      expectedTokens: n,
      actualTokens: r,
      correctCount: u,
      accuracy: Ke(u, n.length, r.length),
      errors: a,
      segments: o,
    };
  }
  var Je = class {
    #e;
    #t = 0;
    #n = null;
    #r = 0;
    constructor(e) {
      this.#e = e;
    }
    setNavigationEpoch(e) {
      e !== this.#r && ((this.#r = e), (this.#n = null));
    }
    async submit(e) {
      if (this.#n !== null) throw Error(`submission:already-active`);
      this.#e.revealSignature().visible &&
        (await this.#e.dismissRevealDialog());
      const t = this.#e.readIdentity(),
        n = ++this.#t,
        r = crypto.randomUUID(),
        i = {
          questionId: t.questionId,
          navigationEpoch: this.#r,
          attemptEpoch: n,
          submissionToken: r,
        };
      this.#n = r;
      try {
        this.#e.writeAnswer(e), this.assertCurrent(i);
        let n = await this.#e.scoreAndWait(t, r);
        if ((this.assertCurrent(i), n))
          this.assertRevealProof(n, t, i, `score`);
        else {
          if (this.#e.revealSignature().visible)
            throw Error(`submission:invalid-reveal-proof`);
          (n = await this.#e.revealAnswerAndWait(t, r)),
            this.assertRevealProof(n, t, i, `answer`);
        }
        this.assertCurrent(i);
        const { answer: a, translation: o } = this.#e.readRevealedContent(n),
          s = qe(a, e);
        return {
          context: i,
          review: {
            accuracy: s.accuracy,
            errors: s.errors,
            correctCount: s.correctCount,
            totalWords: s.expectedTokens.length,
            segments: s.segments,
            answerText: a,
            translation: o,
          },
        };
      } finally {
        this.#n === r && (this.#n = null),
          this.#e.dismissRevealDialog().catch(() => void 0);
      }
    }
    async redo() {
      if (this.#n !== null) throw Error(`submission:already-active`);
      if (!this.#e.capabilities().redo) throw Error(`redo:unsupported`);
      const e = this.#e.readIdentity();
      this.#e.click(`redo`),
        await Ye(
          () =>
            this.#e.readIdentity().questionId === e.questionId &&
            this.#e.input().value === `` &&
            !this.#e.revealSignature().visible &&
            !this.#e.isScoreComplete(),
          5e3,
        ),
        (this.#t += 1);
    }
    assertCurrent(e) {
      if (
        this.#e.readIdentity().questionId !== e.questionId ||
        this.#r !== e.navigationEpoch ||
        this.#t !== e.attemptEpoch ||
        this.#n !== e.submissionToken
      )
        throw Error(`submission:stale-context`);
    }
    assertRevealProof(e, t, n, r) {
      if (
        e.predictionEdition !== t.predictionEdition ||
        e.questionId !== t.questionId ||
        e.position !== t.position ||
        e.total !== t.total ||
        e.operationToken !== n.submissionToken ||
        e.source !== r
      )
        throw Error(`submission:invalid-reveal-proof`);
    }
  };
  async function Ye(e, t) {
    const n = performance.now() + t;
    for (; performance.now() < n; ) {
      if (e()) return;
      await new Promise((e) => setTimeout(e, 50));
    }
    throw Error(`operation:timeout`);
  }
  var Xe = 3,
    Ze = class extends Error {
      code = `AUDIO_ERROR`;
      constructor(e, t) {
        super(e, t), (this.name = `AudioBrokerError`);
      }
    },
    Qe = class extends EventTarget {
      #e;
      #t = null;
      #n = `practice`;
      #r = `EMPTY`;
      #i = !1;
      #a = null;
      #o = null;
      constructor(e) {
        super(), (this.#e = e);
      }
      get state() {
        return this.#r;
      }
      bind(e, t) {
        this.releaseElement(),
          this.stopSiteAudio(),
          (this.#t = { questionId: e, navigationEpoch: t }),
          (this.#i = !1),
          this.setState(`EMPTY`),
          this.warmUp();
      }
      warmUp() {
        const e = this.adoptElement();
        e && e.preload !== `auto` && (e.preload = `auto`);
      }
      setMode(e) {
        this.#n = e;
      }
      snapshot() {
        const e = this.#a;
        return !e || !Number.isFinite(e.duration)
          ? null
          : {
              currentTime: e.currentTime,
              duration: e.duration,
              playing: !e.paused && !e.ended,
            };
      }
      async play() {
        const e = this.requireBinding();
        try {
          this.assertCurrent(e);
          const t = this.adoptElement();
          if (t) {
            if (!t.paused && !t.ended) {
              t.pause(), this.setState(`PAUSED`);
              return;
            }
            this.assertExamPlayAvailable(),
              t.readyState < Xe && this.setState(`BUFFERING`),
              await t.play(),
              this.assertCurrent(e),
              this.#n === `exam` && (this.#i = !0),
              this.setState(`PLAYING`);
            return;
          }
          if (this.#r === `PLAYING`) {
            this.#e.pauseAudio(), this.setState(`PAUSED`);
            return;
          }
          this.assertExamPlayAvailable(),
            this.#e.playAudio(),
            this.assertCurrent(e),
            this.#n === `exam` && (this.#i = !0),
            this.setState(`PLAYING`);
        } catch (t) {
          if (this.handleBenignPlaybackError(e, t)) return;
          throw (this.failClosed(e), $e(t));
        }
      }
      async restart() {
        const e = this.requireBinding();
        try {
          if ((this.assertCurrent(e), this.#n === `exam` && this.#i))
            throw new Ze(`audio:exam-play-consumed`);
          const t = this.adoptElement();
          if (t) {
            (t.currentTime = 0),
              (t.paused || t.ended) &&
                (t.readyState < Xe && this.setState(`BUFFERING`),
                await t.play()),
              this.assertCurrent(e),
              this.#n === `exam` && (this.#i = !0),
              this.setState(`PLAYING`);
            return;
          }
          this.#e.playAudio(),
            this.assertCurrent(e),
            this.#n === `exam` && (this.#i = !0),
            this.setState(`PLAYING`);
        } catch (t) {
          if (this.handleBenignPlaybackError(e, t)) return;
          throw (this.failClosed(e), $e(t));
        }
      }
      handleBenignPlaybackError(e, t) {
        if (!(t instanceof DOMException) || this.#t !== e) return !1;
        if (t.name === `NotAllowedError`)
          throw (
            (this.setState(`READY`),
            new Ze(`audio:needs-gesture`, { cause: t }))
          );
        if (t.name === `NotSupportedError`)
          throw (
            (this.setState(`EMPTY`), new Ze(`audio:not-ready`, { cause: t }))
          );
        if (t.name === `AbortError`) {
          const e = this.#a;
          return (
            e && !e.paused && !e.ended
              ? this.setState(`PLAYING`)
              : this.#r === `BUFFERING` && this.setState(`PAUSED`),
            !0
          );
        }
        return !1;
      }
      pause() {
        const e = this.requireBinding();
        this.assertCurrent(e);
        const t = this.adoptElement();
        t ? t.paused || t.pause() : this.#e.pauseAudio(),
          this.setState(`PAUSED`);
      }
      dispose() {
        this.invalidate();
      }
      invalidate() {
        this.releaseElement(),
          this.stopSiteAudio(),
          (this.#t = null),
          this.setState(`EMPTY`);
      }
      adoptElement() {
        const e = this.#e.siteAudioElements(),
          t = e.length === 1 ? e : e.filter((e) => e.currentSrc || e.src),
          n =
            t.find((e) => !e.paused && !e.ended) ??
            [...t].sort((e, t) => t.readyState - e.readyState)[0] ??
            null;
        if (n === this.#a) return n;
        if ((this.releaseElement(), !n)) return null;
        const r = this.#t,
          i = () => this.#t === r && r !== null,
          a = () => {
            i() && this.setState(`ENDED`);
          },
          o = () => {
            i() && !n.ended && this.#r === `PLAYING` && this.setState(`PAUSED`);
          },
          s = () => {
            i() && this.setState(`PLAYING`);
          },
          c = () => {
            i() && this.#r === `PLAYING` && this.setState(`BUFFERING`);
          },
          l = () => {
            i() && this.setState(`PLAYING`);
          };
        return (
          n.addEventListener(`ended`, a),
          n.addEventListener(`pause`, o),
          n.addEventListener(`play`, s),
          n.addEventListener(`waiting`, c),
          n.addEventListener(`playing`, l),
          (this.#a = n),
          (this.#o = () => {
            n.removeEventListener(`ended`, a),
              n.removeEventListener(`pause`, o),
              n.removeEventListener(`play`, s),
              n.removeEventListener(`waiting`, c),
              n.removeEventListener(`playing`, l);
          }),
          n
        );
      }
      releaseElement() {
        this.#o?.(), (this.#o = null), (this.#a = null);
      }
      requireBinding() {
        if (!this.#t) throw new Ze(`audio:not-bound`);
        return this.#t;
      }
      assertCurrent(e) {
        if (this.#t !== e) throw new Ze(`audio:stale-binding`);
        const t = this.#e.readQuestionIdFast();
        if (t !== null && t !== e.questionId)
          throw new Ze(`audio:stale-binding`);
      }
      assertExamPlayAvailable() {
        if (this.#n === `exam` && this.#i)
          throw new Ze(`audio:exam-play-consumed`);
      }
      stopSiteAudio() {
        for (const e of this.#e.siteAudioElements()) {
          e.pause();
          try {
            e.currentTime = 0;
          } catch {}
        }
      }
      failClosed(e) {
        this.#t === e && (this.stopSiteAudio(), this.setState(`AUDIO_ERROR`));
      }
      setState(e) {
        (this.#r = e),
          this.dispatchEvent(new CustomEvent(`statechange`, { detail: e }));
      }
    };
  function $e(e) {
    return e instanceof Ze
      ? e
      : new Ze(e instanceof Error ? e.message : `audio:unknown`, { cause: e });
  }
  var et = {
    previous: new Set([`上一题`, `Previous`, `Prev`]),
    next: new Set([`下一题`, `Next`]),
    score: new Set([`评分`, `Score`]),
    answer: new Set([`答案`, `Answer`]),
    redo: new Set([`重做`, `Redo`, `Try again`]),
    play: new Set([`Play`, `播放`]),
    pause: new Set([`Pause`, `暂停`]),
  };
  function tt(e) {
    return e?.replace(/\s+/gu, ` `).trim() ?? ``;
  }
  function nt(e, t) {
    return et[e].has(tt(t));
  }
  function rt(e, t) {
    if (e.length !== 1)
      throw Error(`${t}:${e.length === 0 ? `missing` : `ambiguous`}`);
    const n = e[0];
    if (n === void 0) throw Error(`${t}:missing`);
    return n;
  }
  function it(e) {
    const t = tt(e),
      n = /^(?:WFD\s*)?(\d+)\s*\/\s*(\d+)$/iu.exec(t);
    if (!n) return null;
    const r = Number(n[1]),
      i = Number(n[2]);
    return !Number.isSafeInteger(r) ||
      !Number.isSafeInteger(i) ||
      r < 1 ||
      i < 1 ||
      r > i
      ? null
      : { position: r, total: i };
  }
  function at(e) {
    const t = tt(e);
    return /^#?(\d{4,12})$/u.exec(t)?.[1] ?? null;
  }
  function ot(e) {
    if (!(e instanceof HTMLElement)) return !1;
    let t = e;
    for (; t; ) {
      const e = getComputedStyle(t);
      if (
        t.hidden ||
        (t.getAttribute(`aria-hidden`) === `true` &&
          t.getAttribute(`data-pte-pilot-isolated`) !== `aria-added`) ||
        e.visibility === `hidden` ||
        e.display === `none` ||
        Number(e.opacity) === 0
      )
        return !1;
      t = t.parentElement;
    }
    const n = e.getBoundingClientRect();
    return n.width > 0 || n.height > 0;
  }
  function st(e) {
    return (
      typeof e.closest != `function` ||
      e.closest(
        `.el-dialog__wrapper, .el-message-box__wrapper, [role='dialog'], [role='alertdialog']`,
      ) === null
    );
  }
  function ct(e) {
    return tt(
      e.getAttribute(`aria-label`) ??
        e.getAttribute(`title`) ??
        (e instanceof HTMLInputElement ? e.value : e.textContent),
    );
  }
  function lt(e, t) {
    const n = e instanceof Error ? e.message : String(e);
    return {
      code: n.endsWith(`:ambiguous`) ? `AMBIGUOUS_CONTROL` : `MISSING_CONTROL`,
      capability: t,
      detail: n,
    };
  }
  var ut = class {
      #e;
      #t = null;
      constructor(e = () => crypto.randomUUID()) {
        this.#e = e;
      }
      begin() {
        const e = this.#e();
        return (
          (this.#t = {
            token: e,
            value: `provisional:${e}`,
            state: `provisional`,
            total: null,
          }),
          e
        );
      }
      beginSession() {
        const e = this.#e();
        return (
          (this.#t = {
            token: e,
            value: `session:${e}`,
            state: `session`,
            total: null,
          }),
          e
        );
      }
      probeDiagnostic() {
        return this.#t?.state === `provisional`
          ? {
              code: `INVALID_QUESTION`,
              detail: `question:prediction-edition-unverified`,
            }
          : null;
      }
      resolve(e) {
        const t = this.#t;
        if (!t) return null;
        if ((t.total === null && (t.total = e), t.total !== e)) {
          if (t.state !== `provisional`) return (this.#t = null), null;
          throw Error(`question:prediction-total-changed`);
        }
        return t.value;
      }
      restore(e, t) {
        return mt(e, t)
          ? ((this.#t = {
              token: this.#e(),
              value: e,
              state: `verified`,
              total: t,
            }),
            !0)
          : !1;
      }
      adopt(e, t, n) {
        const r = this.#t;
        if (r?.state !== `provisional` || r.token !== n)
          throw Error(`question:prediction-bootstrap-missing`);
        if (r.total !== null && r.total !== t)
          throw Error(`question:prediction-total-changed`);
        if (!mt(e, t)) throw Error(`question:prediction-edition-unverified`);
        this.#t = { token: n, value: e, state: `verified`, total: t };
      }
      clear(e) {
        return this.#t?.token === e ? ((this.#t = null), !0) : !1;
      }
      invalidateProvisional(e) {
        return this.#t?.state !== `provisional` || this.#t.token !== e
          ? !1
          : ((this.#t = null), !0);
      }
      invalidateVerified(e) {
        return this.#t?.state !== `verified` || this.#t.value !== e
          ? !1
          : ((this.#t = null), !0);
      }
    },
    dt = class {
      #e;
      #t = new ut();
      #n = new Map();
      #r = null;
      constructor(e = window.document) {
        this.#e = e;
      }
      probe() {
        const e = this.#t.probeDiagnostic();
        if (e) return { ok: !1, diagnostic: e };
        if (this.#i())
          return {
            ok: !1,
            diagnostic: {
              code: `AUTH_REQUIRED`,
              detail: `Firefly login required`,
            },
          };
        let t;
        try {
          (t = this.readIdentity()), this.input(), this.control(`score`);
        } catch (e) {
          const t = e instanceof Error ? e.message : String(e);
          return {
            ok: !1,
            diagnostic: {
              code: t.startsWith(`question:`)
                ? `INVALID_QUESTION`
                : `SITE_CHANGED`,
              detail: t,
            },
          };
        }
        return { ok: !0, identity: t, capabilities: this.capabilities() };
      }
      capabilities() {
        return {
          input: this.findInputs().length === 1,
          score: this.findControls(`score`).length === 1,
          answer: this.findControls(`answer`).length === 1,
          previous: this.findControls(`previous`).length === 1,
          next: this.findControls(`next`).length === 1,
          redo: this.findControls(`redo`).length === 1,
          play:
            this.findControls(`play`).length === 1 ||
            this.siteAudioElements().length === 1 ||
            Array.from(this.#e.querySelectorAll(`.audio-pause-btn`)).filter(ot)
              .length === 1,
          select: this.supportsDirectSelection(),
        };
      }
      readIdentity() {
        const e = this.readPositionAndQuestionId();
        return {
          predictionEdition: this.readPredictionEdition(e.total),
          questionId: e.questionId,
          position: e.position,
          total: e.total,
          tags: this.readTags(),
        };
      }
      readBareIdentity() {
        try {
          return this.readPositionAndQuestionId();
        } catch {
          return null;
        }
      }
      restoreVerifiedPredictionEdition(e, t) {
        return this.#t.restore(e, t);
      }
      readPositionAndQuestionId() {
        const e = rt(
            Dt(
              this.visibleElements()
                .map((e) => it(e.textContent ?? ``))
                .filter((e) => e !== null),
              (e) => `${e.position}/${e.total}`,
            ),
            `question:position`,
          ),
          t = Array.from(
            this.#e.querySelectorAll(
              `[data-question-id]:not(option), [data-exercise-id]:not(option)`,
            ),
          )
            .filter(ot)
            .filter(st)
            .map((e) =>
              at(
                e.dataset.questionId ??
                  e.dataset.exerciseId ??
                  e.textContent ??
                  ``,
              ),
            )
            .filter((e) => e !== null),
          n = this.visibleElements()
            .map((e) => at(e.textContent ?? ``))
            .filter((e) => e !== null);
        return {
          questionId: rt(
            Dt(t.length > 0 ? t : n, (e) => e),
            `question:id`,
          ),
          position: e.position,
          total: e.total,
        };
      }
      beginProvisionalPredictionEdition() {
        return this.#t.begin();
      }
      beginSessionPredictionEdition() {
        return this.#t.beginSession();
      }
      adoptVerifiedPredictionEdition(e, t, n) {
        this.#t.adopt(e, t, n);
      }
      clearPredictionEditionOverride(e) {
        this.#t.clear(e);
      }
      invalidateProvisionalPredictionEdition(e) {
        return this.#t.invalidateProvisional(e);
      }
      invalidateVerifiedPredictionEdition(e) {
        return this.#t.invalidateVerified(e);
      }
      supportsDirectSelection() {
        if (this.questionSelect() !== null) return !0;
        try {
          return this.customQuestionItems(this.readIdentity().total) !== null;
        } catch {
          return !1;
        }
      }
      input() {
        return rt(this.findInputs(), `input`);
      }
      control(e) {
        try {
          return rt(this.findControls(e), e);
        } catch (t) {
          throw Object.assign(Error(lt(t, e).detail), { capability: e });
        }
      }
      click(e) {
        const t = this.control(e);
        if (
          t.getAttribute(`aria-disabled`) === `true` ||
          (`disabled` in t && t.disabled)
        )
          throw Error(`${e}:disabled`);
        t.click();
      }
      playAudio() {
        this.audioToggleControl(`play`).click();
      }
      pauseAudio() {
        this.audioToggleControl(`pause`).click();
      }
      writeAnswer(e) {
        const t = this.input(),
          n = Object.getOwnPropertyDescriptor(
            HTMLTextAreaElement.prototype,
            `value`,
          )?.set;
        if (!n) throw Error(`input:native-setter-missing`);
        if (
          (n.call(t, e),
          t.dispatchEvent(
            new InputEvent(`input`, {
              bubbles: !0,
              inputType: `insertText`,
              data: e,
            }),
          ),
          t.dispatchEvent(new Event(`change`, { bubbles: !0 })),
          t.value !== e)
        )
          throw Error(`input:writeback-mismatch`);
      }
      revealSignature() {
        const e = this.revealNodes().filter(ot);
        return {
          visible: e.length > 0,
          nodeCount: e.length,
          textLength: e.reduce((e, t) => e + tt(t.textContent).length, 0),
        };
      }
      async scoreAndWait(e, t, n = 8e3) {
        this.#r = null;
        const r = this.explicitRevealSignature(),
          i = this.fireflyScoreAnswerState();
        if (r.visible) throw Error(`score:answer-already-visible`);
        if (this.explicitRevealNodes().some((e) => Tt(e) > 0))
          throw Error(`score:stale-answer-residue`);
        if (i.candidateCount > 1) throw Error(`score:firefly-answer-ambiguous`);
        const a = this.scoreState(e),
          o = await this.waitForVerifiedTransition(
            e,
            () => {
              const t = this.explicitRevealSignature(),
                n = this.fireflyScoreAnswerState(),
                o = this.scoreState(e);
              return bt(r, t)
                ? { kind: `explicit-reveal` }
                : n.candidateCount === 1 &&
                    n.visible &&
                    n.node &&
                    n.fingerprint &&
                    (n.fingerprint !== i.fingerprint ||
                      this.#n.get(n.fingerprint) === e.questionId)
                  ? {
                      kind: `firefly-reveal`,
                      node: n.node,
                      fingerprint: n.fingerprint,
                    }
                  : o.complete && !a.complete && o.signature !== a.signature
                    ? { kind: `score` }
                    : null;
            },
            () => this.click(`score`),
            n,
            `score`,
          );
        return o.kind === `explicit-reveal`
          ? this.bindExplicitRevealProof(e, t, `score`)
          : o.kind === `firefly-reveal`
            ? this.bindCausalFireflyProof(e, t, o.node, o.fingerprint)
            : null;
      }
      async revealAnswerAndWait(e, t, n = 8e3) {
        this.#r = null;
        const r = this.explicitRevealSignature();
        if (r.visible) throw Error(`reveal:answer-already-visible`);
        return (
          await this.waitForVerifiedTransition(
            e,
            () => (bt(r, this.explicitRevealSignature()) ? !0 : null),
            () => this.click(`answer`),
            n,
            `reveal`,
          ),
          this.bindExplicitRevealProof(e, t, `answer`)
        );
      }
      isScoreComplete() {
        return this.scoreState(this.readIdentity()).complete;
      }
      readRevealedAnswer(e) {
        return this.readRevealedContent(e).answer;
      }
      readRevealedContent(e) {
        const t = this.#r;
        if (!t || t.proof !== e) throw Error(`answer:unproven-reveal`);
        if (!Ct(this.readIdentity(), e)) throw Error(`answer:question-changed`);
        const n = rt(
          t.kind === `firefly-score`
            ? this.fireflyScoreAnswerNodes().filter(ot)
            : this.explicitRevealNodes().filter(ot),
          `answer:revealed`,
        );
        if (n !== t.node) throw Error(`answer:reveal-node-changed`);
        if (
          (t.kind === `firefly-score` && xt(n) !== t.fingerprint) ||
          !wt(this.revealSignature(), t.signature)
        )
          throw Error(`answer:reveal-changed`);
        const r = tt(n.textContent);
        if (r.length === 0) throw Error(`answer:empty`);
        const i = t.kind === `firefly-score` ? St(n) : null;
        return (
          t.kind === `firefly-score` &&
            (this.#n.size > 512 && this.#n.clear(),
            this.#n.set(t.fingerprint, e.questionId)),
          (this.#r = null),
          { answer: r, translation: i }
        );
      }
      async dismissRevealDialog(e = 1200) {
        const t = performance.now() + e;
        for (;;) {
          const e = this.visibleScoreDialogWrappers();
          if (e.length === 0) return !0;
          for (const t of e)
            (
              t.querySelector(
                `.el-dialog__headerbtn, [aria-label='Close'], [aria-label='关闭']`,
              ) ?? t
            ).click();
          try {
            this.#e.dispatchEvent(
              new KeyboardEvent(`keydown`, { key: `Escape`, bubbles: !0 }),
            );
          } catch {}
          if (performance.now() >= t)
            return this.visibleScoreDialogWrappers().length === 0;
          await new Promise((e) => setTimeout(e, 80));
        }
      }
      questionOptions() {
        const e = this.questionSelect();
        if (!e) return null;
        const t = this.readIdentity(),
          n = Array.from(e.options)
            .map((n, r) => {
              const i = at(n.dataset.questionId ?? ``) ?? at(n.value) ?? null;
              return i
                ? {
                    predictionEdition: t.predictionEdition,
                    questionId: i,
                    position: r + 1,
                    total: e.options.length,
                    tags: [],
                  }
                : null;
            })
            .filter((e) => e !== null),
          r = n[t.position - 1];
        return n.length === e.options.length &&
          n.length === t.total &&
          new Set(n.map((e) => e.questionId)).size === t.total &&
          r?.questionId === t.questionId
          ? n
          : null;
      }
      selectQuestion(e) {
        const t = this.questionSelect();
        if (t) {
          const n = t.options.item(e - 1);
          if (!n) throw Error(`select:target-missing`);
          (t.value = n.value),
            t.dispatchEvent(new Event(`change`, { bubbles: !0 }));
          return;
        }
        const n = this.customQuestionItems(this.readIdentity().total),
          r = n?.[e - 1];
        if (!r) throw Error(n ? `select:target-missing` : `select:missing`);
        r.click();
      }
      siteAudioElements() {
        return Array.from(this.#e.querySelectorAll(`audio`));
      }
      readQuestionIdFast() {
        const e = Array.from(
            this.#e.querySelectorAll(
              `[data-question-id]:not(option), [data-exercise-id]:not(option)`,
            ),
          )
            .filter(ot)
            .filter(st)
            .map((e) =>
              at(
                e.dataset.questionId ??
                  e.dataset.exerciseId ??
                  e.textContent ??
                  ``,
              ),
            )
            .filter((e) => e !== null),
          t = [...new Set(e)];
        return t.length === 1 ? (t[0] ?? null) : null;
      }
      observeQuestionChanges(e) {
        let t = Ot(this),
          n = new MutationObserver(() => {
            const n = Ot(this);
            !n || n.key === t?.key || ((t = n), e(n.identity));
          });
        return (
          n.observe(this.#e.documentElement, {
            childList: !0,
            subtree: !0,
            characterData: !0,
            attributes: !0,
            attributeFilter: [
              `data-question-id`,
              `data-exercise-id`,
              `data-prediction-edition`,
              `value`,
              `selected`,
            ],
          }),
          () => n.disconnect()
        );
      }
      findControls(e) {
        return Array.from(
          this.#e.querySelectorAll(
            `button, [role='button'], input[type='button'], input[type='submit']`,
          ),
        ).filter((t) => ot(t) && st(t) && nt(e, ct(t)));
      }
      audioToggleControl(e) {
        const t = this.findControls(e);
        return t.length > 0
          ? rt(t, `audio:${e}`)
          : rt(
              Array.from(this.#e.querySelectorAll(`.audio-pause-btn`)).filter(
                ot,
              ),
              `audio:${e}`,
            );
      }
      findInputs() {
        const e = Array.from(this.#e.querySelectorAll(`textarea`)).filter(ot),
          t = e.filter((e) =>
            new Set([
              `请输入内容`,
              `Type your answer`,
              `Type your answer here`,
            ]).has(tt(e.placeholder)),
          );
        return t.length > 0 ? t : e;
      }
      visibleElements() {
        return Array.from(
          this.#e.querySelectorAll(
            `[data-question-id], [data-exercise-id], [aria-label], h1, h2, h3, h4, span, strong, b, label, li`,
          ),
        )
          .filter(ot)
          .filter(st);
      }
      questionSelect() {
        const e = Array.from(this.#e.querySelectorAll(`select`)).filter(ot),
          t = e.filter((e) => {
            const t = ct(e);
            return new Set([`选择题号`, `Question`, `Question number`]).has(t);
          });
        return t.length === 1
          ? (t[0] ?? null)
          : e.length === 1
            ? (e[0] ?? null)
            : null;
      }
      customQuestionItems(e) {
        if (
          Array.from(this.#e.querySelectorAll(`input[readonly]`)).filter(
            (e) => tt(e.placeholder) === `选择题号` && ot(e),
          ).length !== 1
        )
          return null;
        const t = Array.from(
          this.#e.querySelectorAll(`.el-select-dropdown__item`),
        );
        return pt(
          t.map((e) => e.textContent ?? ``),
          e,
        )
          ? t
          : null;
      }
      revealNodes() {
        return [
          ...this.explicitRevealNodes(),
          ...this.fireflyScoreAnswerNodes(),
        ];
      }
      explicitRevealNodes() {
        return Array.from(
          this.#e.querySelectorAll(
            [
              `[data-pte-answer]`,
              `[data-testid='answer']`,
              `[aria-label='正确答案']`,
              `[aria-label='Correct answer']`,
            ].join(`, `),
          ),
        );
      }
      explicitRevealSignature() {
        const e = this.explicitRevealNodes().filter(ot);
        return {
          visible: e.length > 0,
          nodeCount: e.length,
          textLength: e.reduce((e, t) => e + tt(t.textContent).length, 0),
        };
      }
      fireflyScoreAnswerNodes() {
        return Array.from(
          this.#e.querySelectorAll(`.el-dialog__wrapper.ai-score pre`),
        ).filter((e) => e.querySelector(`span.oneword`) !== null);
      }
      visibleScoreDialogWrappers() {
        return Array.from(
          this.#e.querySelectorAll(`.el-dialog__wrapper.ai-score`),
        ).filter(ot);
      }
      fireflyScoreAnswerState() {
        const e = this.fireflyScoreAnswerNodes(),
          t = e.length === 1 ? (e[0] ?? null) : null;
        return {
          candidateCount: e.length,
          node: t,
          visible: t ? ot(t) : !1,
          fingerprint: t ? xt(t) : null,
        };
      }
      scoreState(e) {
        const t = Array.from(
          this.#e.querySelectorAll(
            `[data-score-complete], [data-testid='score-proof']`,
          ),
        )
          .filter(ot)
          .filter((t) => Et(t) === e.questionId)
          .map((e) => ({
            complete:
              e.dataset.scoreComplete === `true` ||
              e.dataset.complete === `true` ||
              new Set([`complete`, `completed`, `scored`]).has(
                e.dataset.status?.toLocaleLowerCase(`en-AU`) ?? ``,
              ),
            questionId: Et(e),
          }));
        return {
          complete: t.some((e) => e.complete),
          signature: JSON.stringify(t),
        };
      }
      waitForVerifiedTransition(e, t, n, r, i) {
        return new Promise((a, o) => {
          let s = !1,
            c,
            l = (e) => {
              s || ((s = !0), f.disconnect(), c && clearTimeout(c), o(e));
            },
            u = (e) => {
              s || ((s = !0), f.disconnect(), c && clearTimeout(c), a(e));
            },
            d = () => {
              let n;
              try {
                n = this.readIdentity();
              } catch {
                return;
              }
              if (!Ct(n, e)) {
                l(Error(`${i}:question-changed`));
                return;
              }
              try {
                const e = t();
                e !== null && u(e);
              } catch {}
            },
            f = new MutationObserver(d);
          f.observe(this.#e.documentElement, {
            subtree: !0,
            childList: !0,
            characterData: !0,
            attributes: !0,
            attributeFilter: [
              `hidden`,
              `style`,
              `class`,
              `disabled`,
              `aria-disabled`,
              `aria-hidden`,
              `data-complete`,
              `data-score-complete`,
              `data-status`,
            ],
          }),
            (c = setTimeout(() => l(Error(`${i}:timeout`)), r));
          try {
            n(), d();
          } catch (e) {
            l(e instanceof Error ? e : Error(String(e)));
          }
        });
      }
      bindExplicitRevealProof(e, t, n) {
        const r = this.readIdentity();
        if (!Ct(r, e)) throw Error(`${n}:question-changed`);
        const i = rt(this.explicitRevealNodes().filter(ot), `answer:revealed`);
        if (Et(i) !== e.questionId)
          throw Error(`answer:question-ownership-unproven`);
        const a = this.revealSignature(),
          o = Object.freeze({
            predictionEdition: r.predictionEdition,
            questionId: r.questionId,
            position: r.position,
            total: r.total,
            operationToken: t,
            source: n,
          });
        return (
          (this.#r = { kind: `explicit`, proof: o, node: i, signature: a }), o
        );
      }
      bindCausalFireflyProof(e, t, n, r) {
        const i = this.readIdentity();
        if (!Ct(i, e)) throw Error(`score:question-changed`);
        const a = this.fireflyScoreAnswerState();
        if (
          a.candidateCount !== 1 ||
          !a.visible ||
          a.node !== n ||
          a.fingerprint !== r
        )
          throw Error(`answer:causal-reveal-changed`);
        const o = this.revealSignature(),
          s = Object.freeze({
            predictionEdition: i.predictionEdition,
            questionId: i.questionId,
            position: i.position,
            total: i.total,
            operationToken: t,
            source: `score`,
          });
        return (
          (this.#r = {
            kind: `firefly-score`,
            proof: s,
            node: n,
            signature: o,
            fingerprint: r,
          }),
          s
        );
      }
      readPredictionEdition(e) {
        const t = Array.from(
            this.#e.querySelectorAll(`[data-prediction-edition]`),
          )
            .filter(ot)
            .filter(st)
            .map((e) => e.dataset.predictionEdition ?? ``),
          n = Array.from(this.#e.querySelectorAll(`h1, h2, h3, h4`))
            .filter(ot)
            .filter(st)
            .map((e) => e.textContent ?? ``),
          r = Array.from(this.questionSelect()?.options ?? [])
            .map((e) => at(e.dataset.questionId ?? ``) ?? at(e.value))
            .filter((e) => e !== null);
        try {
          return ft({
            explicitValues: t,
            headingTexts: n,
            optionQuestionIds: r,
            expectedTotal: e,
          });
        } catch (t) {
          if (
            !(t instanceof Error) ||
            t.message !== `question:prediction-edition-unverified`
          )
            throw t;
          const n = this.#t.resolve(e);
          if (n === null) throw t;
          return n;
        }
      }
      readTags() {
        return Dt(
          Array.from(this.#e.querySelectorAll(`[data-question-tag]`))
            .filter(ot)
            .filter(st)
            .map((e) => tt(e.dataset.questionTag ?? e.textContent))
            .filter(Boolean),
          (e) => e,
        );
      }
      #i() {
        if (/\/(?:login|signin)(?:\/|$)/iu.test(this.#e.location.pathname))
          return !0;
        const e = this.#e.querySelector(`input[type='password']`);
        return e instanceof HTMLInputElement && ot(e)
          ? !0
          : Array.from(
              this.#e.querySelectorAll(
                `button, a, h1, h2, [role='dialog'], [class*='login']`,
              ),
            )
              .filter(ot)
              .map((e) => tt(e.textContent))
              .filter((e) => /^(?:登录|注册|login|sign in|log in)$/iu.test(e))
              .length > 0 && this.findInputs().length === 0;
      }
    };
  function ft(e) {
    const t = [...new Set(e.explicitValues.map(tt).filter((e) => e && !ht(e)))],
      n = [
        ...new Set(
          e.headingTexts.map(tt).filter((e) => {
            const t =
              /^(?:周预测|Weekly prediction)(?:\s*[:：#-]\s*|\s+)(.+)$/iu.exec(
                e,
              );
            return !!(t?.[1] && gt(t[1]));
          }),
        ),
      ];
    if (t.length > 1 || n.length > 1)
      throw Error(`question:prediction-edition-ambiguous`);
    const r = t[0],
      i = n[0];
    if (r && i && !_t(r, i))
      throw Error(`question:prediction-edition-ambiguous`);
    if (r) return r;
    if (i) return i;
    const a = e.optionQuestionIds;
    if (
      Number.isSafeInteger(e.expectedTotal) &&
      e.expectedTotal > 0 &&
      a.length === e.expectedTotal &&
      new Set(a).size === e.expectedTotal
    )
      return `yc-set-${a.length}-${yt(a.join(`\0`))}`;
    throw Error(`question:prediction-edition-unverified`);
  }
  function pt(e, t) {
    return (
      e.length > 0 &&
      (t === void 0 || e.length === t) &&
      e.every((e, t) => tt(e) === String(t + 1))
    );
  }
  function mt(e, t) {
    return (
      Number.isSafeInteger(t) &&
      t > 0 &&
      RegExp(`^yc-set-${t}-[0-9a-f]{16}$`, `u`).test(e)
    );
  }
  function ht(e) {
    return /^(?:周预测|Weekly prediction)$/iu.test(e);
  }
  function gt(e) {
    const t = /(?:19|20)\d{2}/u.test(e),
      n = /(?:\bW(?:eek)?\s*[-:#]?\s*\d{1,2}\b|第\s*\d{1,2}\s*周)/iu.test(e),
      r =
        /(?:19|20)\d{2}\s*[-/.年]\s*(?:0?[1-9]|1[0-2])\s*[-/.月]\s*(?:0?[1-9]|[12]\d|3[01])(?:\s*日)?/u.test(
          e,
        );
    return t && (n || r);
  }
  function _t(e, t) {
    const n = vt(e),
      r = vt(t);
    if (n && r) return n === r;
    const i = e.toLocaleLowerCase(`en-AU`),
      a = t.toLocaleLowerCase(`en-AU`);
    return i.includes(a) || a.includes(i);
  }
  function vt(e) {
    const t =
      /((?:19|20)\d{2})\s*[-/.年]\s*(0?[1-9]|1[0-2])\s*[-/.月]\s*(0?[1-9]|[12]\d|3[01])(?:\s*日)?/u.exec(
        e,
      );
    if (t?.[1] && t[2] && t[3])
      return `date:${t[1]}-${t[2].padStart(2, `0`)}-${t[3].padStart(2, `0`)}`;
    const n =
      /((?:19|20)\d{2})[\s/_-]*(?:W(?:eek)?)[\s:#/_-]*(\d{1,2})/iu.exec(e) ??
      /((?:19|20)\d{2})\s*年?\s*第?\s*(\d{1,2})\s*周/u.exec(e) ??
      /\bweekly[\s/_-]*((?:19|20)\d{2})[\s/_-]+W?(\d{1,2})\b/iu.exec(e);
    if (!n?.[1] || !n[2]) return null;
    const r = Number(n[2]);
    return r >= 1 && r <= 53
      ? `week:${n[1]}-${String(r).padStart(2, `0`)}`
      : null;
  }
  function yt(e) {
    let t = 14695981039346656037n;
    for (const n of new TextEncoder().encode(e))
      (t ^= BigInt(n)), (t = BigInt.asUintN(64, t * 1099511628211n));
    return t.toString(16).padStart(16, `0`);
  }
  function bt(e, t) {
    return (
      t.visible &&
      (!e.visible ||
        t.nodeCount !== e.nodeCount ||
        t.textLength !== e.textLength)
    );
  }
  function xt(e) {
    const t = tt(e.textContent);
    return t.length > 0 ? yt(t) : null;
  }
  function St(e) {
    try {
      const t = e.closest(`.el-dialog__body`);
      if (!t) return null;
      const n =
        Array.from(t.querySelectorAll(`h1, h2, h3, h4, h5`))
          .find((e) => /^(?:译文|translation)$/iu.test(tt(e.textContent)))
          ?.nextElementSibling?.textContent?.trim() ?? ``;
      return n.length > 0 ? n : null;
    } catch {
      return null;
    }
  }
  function Ct(e, t) {
    return (
      e.predictionEdition === t.predictionEdition &&
      e.questionId === t.questionId &&
      e.position === t.position &&
      e.total === t.total
    );
  }
  function wt(e, t) {
    return (
      e.visible === t.visible &&
      e.nodeCount === t.nodeCount &&
      e.textLength === t.textLength
    );
  }
  function Tt(e) {
    return tt(e.textContent).length;
  }
  function Et(e) {
    let t = e;
    for (; t; ) {
      const e = t.dataset.questionId ?? t.dataset.exerciseId;
      if (e !== void 0) return at(e);
      t = t.parentElement;
    }
    return null;
  }
  function Dt(e, t) {
    return [...new Map(e.map((e) => [t(e), e])).values()];
  }
  function Ot(e) {
    try {
      const t = e.readIdentity();
      return {
        key: `${t.predictionEdition}:${t.questionId}:${t.position}`,
        identity: t,
      };
    } catch {
      return null;
    }
  }
  var kt = class extends EventTarget {
    #e;
    #t;
    #n = 0;
    #r = null;
    #i;
    #a = null;
    constructor(e) {
      super(),
        (this.#e = e),
        (this.#i = e.readIdentity()),
        (this.#t = e.observeQuestionChanges((e) => {
          this.#r === null && this.scheduleManualChange(e);
        }));
    }
    get epoch() {
      return this.#n;
    }
    get current() {
      return this.#i;
    }
    async navigate(e, t = 8e3, n) {
      if (this.#r !== null) throw Error(`navigation:already-active`);
      if (n?.aborted) throw Error(`navigation:aborted`);
      const r = this.#e.readIdentity(),
        i = At(r, e);
      if (i < 1 || i > r.total) throw Error(`navigation:target-out-of-range`);
      const a = ++this.#n;
      this.clearManualChange(), (this.#r = a);
      try {
        if (
          (this.dispatchEvent(
            new CustomEvent(`navigationstart`, {
              detail: { identity: r, epoch: a, manual: !1 },
            }),
          ),
          n?.aborted)
        )
          throw Error(`navigation:aborted`);
        e.kind === `select`
          ? this.#e.selectQuestion(e.position)
          : this.#e.click(e.kind);
        const o = await Mt(
          this.#e,
          (t) =>
            t.predictionEdition !== r.predictionEdition ||
            t.position !== i ||
            t.total !== r.total ||
            (e.kind !== `select` && t.questionId === r.questionId)
              ? !1
              : !e.expectedQuestionId || t.questionId === e.expectedQuestionId,
          t,
          n,
        );
        if (a !== this.#n) throw Error(`navigation:stale-epoch`);
        return (
          (this.#i = o),
          this.dispatchEvent(
            new CustomEvent(`navigated`, { detail: { identity: o, epoch: a } }),
          ),
          { identity: o, epoch: a }
        );
      } finally {
        this.#r === a && (this.#r = null);
      }
    }
    dispose() {
      this.clearManualChange(), this.#t();
    }
    scheduleManualChange(e) {
      this.clearManualChange();
      const t = jt(e);
      this.#a = setTimeout(() => {
        if (((this.#a = null), this.#r !== null)) return;
        let e;
        try {
          e = this.#e.readIdentity();
        } catch {
          return;
        }
        jt(e) !== t ||
          jt(e) === jt(this.#i) ||
          ((this.#i = e),
          (this.#n += 1),
          this.dispatchEvent(
            new CustomEvent(`navigationstart`, {
              detail: { identity: e, epoch: this.#n, manual: !0 },
            }),
          ),
          this.dispatchEvent(
            new CustomEvent(`manualchange`, {
              detail: { identity: e, epoch: this.#n },
            }),
          ));
      }, 120);
    }
    clearManualChange() {
      this.#a !== null && (clearTimeout(this.#a), (this.#a = null));
    }
  };
  function At(e, t) {
    return t.kind === `previous`
      ? e.position - 1
      : t.kind === `next`
        ? e.position + 1
        : t.position;
  }
  function jt(e) {
    return `${e.predictionEdition}:${e.questionId}:${e.position}:${e.total}`;
  }
  function Mt(e, t, n, r) {
    return new Promise((i, a) => {
      let o = !1,
        s = null,
        c = 0,
        l = null,
        u = null,
        d = () => void 0,
        f = () => {
          l !== null && clearTimeout(l),
            u !== null && clearInterval(u),
            (l = null),
            (u = null),
            d(),
            (d = () => void 0),
            r?.removeEventListener(`abort`, h);
        },
        p = (e) => {
          o || ((o = !0), f(), i(e));
        },
        m = (e) => {
          o || ((o = !0), f(), a(e));
        },
        h = () => m(Error(`navigation:aborted`)),
        g = (e) => {
          if (!t(e)) {
            (s = null), (c = 0);
            return;
          }
          const n = jt(e),
            r = performance.now();
          if (n !== s) {
            (s = n), (c = r);
            return;
          }
          r - c >= 120 && p(e);
        };
      if (r?.aborted) {
        h();
        return;
      }
      if (
        (r?.addEventListener(`abort`, h, { once: !0 }),
        (d = e.observeQuestionChanges(g)),
        o)
      ) {
        d(), (d = () => void 0);
        return;
      }
      (u = setInterval(() => {
        try {
          g(e.readIdentity());
        } catch {}
      }, 50)),
        (l = setTimeout(() => m(Error(`navigation:timeout`)), n));
    });
  }
  var Nt = class extends EventTarget {
    #e;
    #t;
    #n;
    #r = null;
    #i = null;
    #a = !1;
    #o = null;
    #s = new Set();
    constructor(e, t, n) {
      super(), (this.#e = e), (this.#t = t), (this.#n = n);
    }
    async discover() {
      const e = this.#e.questionOptions();
      if (e) {
        const t = Bt(e, `complete`);
        for (const t of e) await this.#n.saveQuestion(zt(t));
        return await this.#n.saveSnapshot(t), t;
      }
      return this.learnCurrent();
    }
    async learnCurrent() {
      const e = this.#e.readIdentity();
      await this.#n.saveQuestion(zt(e));
      const t = {
        predictionEdition: e.predictionEdition,
        orderedQuestionIds: [e.questionId],
        siteTotal: e.total,
        completeness: `partial`,
        checkpointPosition: e.position,
        schemaVersion: 1,
      };
      return await this.#n.saveSnapshot(t), t;
    }
    async controlledTraversal(e = Promise.resolve()) {
      if (this.#r) throw Error(`index:already-running`);
      const t = new AbortController(),
        n = new AbortController();
      (this.#r = t), (this.#i = n), (this.#a = !1), (this.#o = null);
      try {
        try {
          await Rt(e, t.signal);
        } catch (e) {
          throw ((this.#o = Lt(e)), e);
        }
        const r = this.#e.questionOptions();
        if (r) return await this.controlledStructuredIndex(r, t);
        const i = this.#e.readIdentity(),
          a = Pt(this.#n.resumeQuestions?.() ?? [], i);
        a.set(i.position, i);
        let o = this.#n.resumeSnapshot?.(),
          s = Ft(o, i),
          c = (e) => {
            s = e.position;
          };
        await this.#n.saveQuestion(zt(i));
        let l = !1;
        try {
          if (this.#e.supportsDirectSelection?.()) {
            const e = Array.from({ length: i.total }, (e, t) => t + 1).filter(
              (e) => !a.has(e),
            );
            for (const n of e) {
              if ((await this.waitUntilResumed(t.signal), t.signal.aborted))
                break;
              const e = await this.#t.navigate(
                { kind: `select`, position: n },
                8e3,
                t.signal,
              );
              a.set(e.identity.position, e.identity),
                c(e.identity),
                await this.#n.saveQuestion(zt(e.identity)),
                await this.#n.saveSnapshot(
                  Bt([...a.values()].sort(Vt), `partial`, e.identity.position),
                );
            }
          } else
            for (const e of It(i, a, s)) {
              const n = this.#e.readIdentity().position;
              await this.walkTo(e, n < e ? `next` : `previous`, a, t.signal, c);
            }
        } catch (e) {
          (l = !0), (this.#o = Lt(e));
        } finally {
          if (!n.signal.aborted)
            try {
              await this.restoreOrigin(i, a, n.signal);
            } catch (e) {
              (l = !0), (this.#o ??= Lt(e));
            }
        }
        const u = [...a.values()].sort(Vt),
          d = this.#e.readIdentity(),
          f = Bt(
            u,
            !l &&
              !t.signal.aborted &&
              d.questionId === i.questionId &&
              Ut(u, i.total)
              ? `complete`
              : `partial`,
            s,
          );
        return await this.#n.saveSnapshot(f), f;
      } finally {
        this.#r === t && (this.#r = null),
          this.#i === n && (this.#i = null),
          (this.#a = !1),
          this.releaseResumeWaiters();
      }
    }
    pause() {
      return !this.#r || this.#a
        ? !1
        : ((this.#a = !0),
          this.dispatchEvent(
            new CustomEvent(`statechange`, { detail: `PAUSED` }),
          ),
          !0);
    }
    resume() {
      return !this.#r || !this.#a
        ? !1
        : ((this.#a = !1),
          this.releaseResumeWaiters(),
          this.dispatchEvent(
            new CustomEvent(`statechange`, { detail: `INDEXING` }),
          ),
          !0);
    }
    cancel() {
      return this.#r
        ? (this.#r.abort(), (this.#a = !1), this.releaseResumeWaiters(), !0)
        : !1;
    }
    hardCancel() {
      return !this.#r && !this.#i
        ? !1
        : (this.#i?.abort(),
          this.#r?.abort(),
          (this.#a = !1),
          this.releaseResumeWaiters(),
          !0);
    }
    dispose() {
      this.hardCancel();
    }
    get failureReason() {
      return this.#o;
    }
    async controlledStructuredIndex(e, t) {
      let n = [],
        r = !1;
      try {
        for (const r of e) {
          if ((await this.waitUntilResumed(t.signal), t.signal.aborted)) break;
          await this.#n.saveQuestion(zt(r)),
            n.push(r),
            await this.#n.saveSnapshot(Bt(n, `partial`, r.position));
        }
      } catch (e) {
        (r = !0), (this.#o = Lt(e));
      }
      if (n.length === 0) {
        if (!t.signal.aborted) throw Error(this.#o ?? `index:no-checkpoint`);
        const r = this.#e.readIdentity();
        if (!e.some((e) => Ht(e, r)))
          throw Error(`index:cancel-identity-mismatch`);
        await this.#n.saveQuestion(zt(r)),
          n.push(r),
          await this.#n.saveSnapshot(Bt(n, `partial`, r.position));
      }
      let i = Bt(
        n,
        !r && !t.signal.aborted && Ut(n, e.length) ? `complete` : `partial`,
        n.at(-1)?.position,
      );
      return (
        await this.#n.saveSnapshot(i),
        t.signal.aborted &&
          i.completeness === `complete` &&
          ((i = { ...i, completeness: `partial` }),
          await this.#n.saveSnapshot(i)),
        i
      );
    }
    async walkTo(e, t, n, r, i) {
      for (; this.#e.readIdentity().position !== e; ) {
        if ((await this.waitUntilResumed(r), r.aborted)) return;
        const e = await this.#t.navigate({ kind: t }, 8e3, r);
        n.set(e.identity.position, e.identity),
          i(e.identity),
          await this.#n.saveQuestion(zt(e.identity)),
          await this.#n.saveSnapshot(
            Bt([...n.values()].sort(Vt), `partial`, e.identity.position),
          );
      }
    }
    async restoreOrigin(e, t, n) {
      let r = this.#e.readIdentity();
      if (r.position !== e.position && this.#e.supportsDirectSelection?.()) {
        const i = await this.#t.navigate(
          {
            kind: `select`,
            position: e.position,
            expectedQuestionId: e.questionId,
          },
          8e3,
          n,
        );
        if (((r = this.#e.readIdentity()), !Ht(i.identity, r) || !Ht(r, e)))
          throw Error(`index:restore-mismatch`);
        t.set(r.position, r), await this.#n.saveQuestion(zt(r));
        return;
      }
      for (; r.position !== e.position; ) {
        const i = r.position < e.position ? `next` : `previous`;
        (r = (await this.#t.navigate({ kind: i }, 8e3, n)).identity),
          t.set(r.position, r),
          await this.#n.saveQuestion(zt(r));
      }
      if (r.questionId !== e.questionId) throw Error(`index:restore-mismatch`);
    }
    async waitUntilResumed(e) {
      for (; this.#a && !e.aborted; )
        await new Promise((t) => {
          const n = () => {
            e.removeEventListener(`abort`, n), this.#s.delete(n), t();
          };
          this.#s.add(n), e.addEventListener(`abort`, n, { once: !0 });
        });
    }
    releaseResumeWaiters() {
      for (const e of this.#s) e();
      this.#s.clear();
    }
  };
  function Pt(e, t) {
    const n = new Map(),
      r = new Map();
    for (const i of e) {
      if (
        i.predictionEdition !== t.predictionEdition ||
        i.siteTotal !== t.total ||
        i.sitePosition > t.total
      )
        continue;
      const e = n.get(i.sitePosition),
        a = r.get(i.questionId);
      if (
        (e && e.questionId !== i.questionId) ||
        (a !== void 0 && a !== i.sitePosition)
      )
        return new Map();
      n.set(i.sitePosition, {
        predictionEdition: i.predictionEdition,
        questionId: i.questionId,
        position: i.sitePosition,
        total: i.siteTotal,
        tags: i.tags,
      }),
        r.set(i.questionId, i.sitePosition);
    }
    return n;
  }
  function Ft(e, t) {
    return e?.predictionEdition !== t.predictionEdition ||
      e.siteTotal !== t.total ||
      e.checkpointPosition === void 0
      ? t.position
      : e.checkpointPosition;
  }
  function It(e, t, n) {
    const r = Array.from({ length: e.total }, (e, t) => t + 1).filter(
        (e) => !t.has(e),
      ),
      i = r.filter((t) => t < e.position),
      a = r.filter((t) => t > e.position),
      o = i.length ? Math.min(...i) : null,
      s = a.length ? Math.max(...a) : null;
    return o !== null && s !== null
      ? n >= e.position
        ? [s, o, e.position]
        : [o, s, e.position]
      : s === null
        ? o === null
          ? []
          : [o, e.position]
        : [s, e.position];
  }
  function Lt(e) {
    return e instanceof Error ? e.message : `index:unknown-failure`;
  }
  function Rt(e, t) {
    return t.aborted
      ? (e.catch(() => void 0), Promise.resolve())
      : new Promise((n, r) => {
          let i = !1,
            a = (e) => {
              i || ((i = !0), t.removeEventListener(`abort`, o), e());
            },
            o = () => a(n);
          t.addEventListener(`abort`, o, { once: !0 }),
            e.then(
              () => a(n),
              (e) => a(() => r(e)),
            );
        });
  }
  function zt(e) {
    return {
      predictionEdition: e.predictionEdition,
      questionId: e.questionId,
      sitePosition: e.position,
      siteTotal: e.total,
      tags: e.tags,
      discoveredAt: new Date().toISOString(),
      schemaVersion: 1,
    };
  }
  function Bt(e, t, n) {
    const r = e[0];
    if (!r) throw Error(`index:empty`);
    const i = {
      predictionEdition: r.predictionEdition,
      orderedQuestionIds: e.sort(Vt).map((e) => e.questionId),
      siteTotal: r.total,
      completeness: t,
      schemaVersion: 1,
    };
    return n !== void 0 && (i.checkpointPosition = n), i;
  }
  function Vt(e, t) {
    return e.position - t.position;
  }
  function Ht(e, t) {
    return (
      e.predictionEdition === t.predictionEdition &&
      e.questionId === t.questionId &&
      e.position === t.position &&
      e.total === t.total
    );
  }
  function Ut(e, t) {
    const n = new Set(e.map((e) => e.position)),
      r = new Set(e.map((e) => e.questionId));
    return (
      n.size === t &&
      r.size === t &&
      Array.from({ length: t }, (e, t) => t + 1).every((e) => n.has(e))
    );
  }
  var Wt = class extends EventTarget {
      #e;
      #t = null;
      #n = null;
      #r = null;
      #i = null;
      #a = !1;
      constructor(e) {
        super(), (this.#e = e);
      }
      async run() {
        if (this.#a) throw Error(`prediction-edition-bootstrap:disposed`);
        if (this.#i)
          throw Error(`prediction-edition-bootstrap:already-running`);
        const e = this.execute();
        return (this.#i = e), e;
      }
      async execute() {
        let e = null,
          t = null;
        try {
          (t = this.#e.beginProvisionalPredictionEdition()), (this.#r = t);
          const n = this.#e.readIdentity(),
            r = new Gt((e, t) => {
              this.dispatchEvent(
                new CustomEvent(`progress`, {
                  detail: { completed: e, total: t },
                }),
              );
            });
          e = new kt(this.#e);
          const i = new Nt(this.#e, e, r);
          (this.#t = e), (this.#n = i);
          const a = await i.controlledTraversal(),
            o = this.#e.readIdentity();
          Kt(a, r.questions, n, o);
          const s = ft({
            explicitValues: [],
            headingTexts: [],
            optionQuestionIds: a.orderedQuestionIds,
            expectedTotal: a.siteTotal,
          });
          this.#e.adoptVerifiedPredictionEdition(s, a.siteTotal, t);
          const c = r.questions
            .sort((e, t) => e.sitePosition - t.sitePosition)
            .map((e) => ({ ...e, predictionEdition: s }));
          return {
            edition: s,
            snapshot: {
              predictionEdition: s,
              orderedQuestionIds: [...a.orderedQuestionIds],
              siteTotal: a.siteTotal,
              completeness: `complete`,
              schemaVersion: a.schemaVersion,
            },
            questions: c,
          };
        } catch (e) {
          throw (t && this.#e.clearPredictionEditionOverride(t), e);
        } finally {
          this.#r === t && (this.#r = null),
            (this.#n = null),
            (this.#t = null),
            e?.dispose();
        }
      }
      cancel() {
        return this.#n?.cancel() ?? !1;
      }
      async dispose() {
        this.#a ||
          ((this.#a = !0),
          this.#r && this.#e.invalidateProvisionalPredictionEdition(this.#r),
          this.#n?.hardCancel(),
          this.#t?.dispose()),
          await this.#i?.catch(() => void 0);
      }
    },
    Gt = class {
      #e;
      #t = new Map();
      constructor(e) {
        this.#e = e;
      }
      get questions() {
        return [...this.#t.values()];
      }
      async saveQuestion(e) {
        this.#t.set(e.sitePosition, e), this.#e(this.#t.size, e.siteTotal);
      }
      async saveSnapshot(e) {}
    };
  function Kt(e, t, n, r) {
    if (e.completeness !== `complete`)
      throw Error(`prediction-edition-bootstrap:incomplete`);
    if (
      !Number.isSafeInteger(e.siteTotal) ||
      e.siteTotal < 1 ||
      e.siteTotal !== n.total ||
      t.some((t) => t.siteTotal !== e.siteTotal)
    )
      throw Error(`prediction-edition-bootstrap:total-changed`);
    if (
      e.orderedQuestionIds.length !== e.siteTotal ||
      new Set(e.orderedQuestionIds).size !== e.siteTotal ||
      t.length !== e.siteTotal ||
      new Set(t.map((e) => e.sitePosition)).size !== e.siteTotal ||
      t.some((t) => e.orderedQuestionIds[t.sitePosition - 1] !== t.questionId)
    )
      throw Error(`prediction-edition-bootstrap:ordered-ids-invalid`);
    if (
      e.predictionEdition !== n.predictionEdition ||
      t.some((t) => t.predictionEdition !== e.predictionEdition)
    )
      throw Error(`prediction-edition-bootstrap:edition-changed`);
    if (!qt(n, r)) throw Error(`prediction-edition-bootstrap:restore-failed`);
  }
  function qt(e, t) {
    return (
      e.predictionEdition === t.predictionEdition &&
      e.questionId === t.questionId &&
      e.position === t.position &&
      e.total === t.total
    );
  }
  var Jt = (e) =>
    e.dueScore * 4 +
    e.weaknessScore * 3 +
    e.noveltyScore * 2 +
    (e.marked ? 2 : 0);
  function Yt(e) {
    return [...e]
      .sort(
        (e, t) =>
          Jt(t) - Jt(e) || e.questionId.localeCompare(t.questionId, `en`),
      )
      .map((e) => e.questionId);
  }
  function Xt(e, t, n) {
    if (e.length === 0) return { kind: `finished` };
    const r = e.indexOf(t);
    if (r === -1) {
      const t = e[0];
      return t
        ? { kind: `go`, questionId: t, position: 1 }
        : { kind: `finished` };
    }
    const i = n === `next` ? r + 1 : r - 1;
    if (i >= e.length) return { kind: `finished` };
    if (i < 0) return { kind: `hold` };
    const a = e[i];
    return a
      ? { kind: `go`, questionId: a, position: i + 1 }
      : { kind: `finished` };
  }
  function Zt(e, t) {
    const n = e.indexOf(t);
    return n === -1 ? null : n + 1;
  }
  var Qt;
  function A(e, t, n) {
    function r(n, r) {
      if (
        (n._zod ||
          Object.defineProperty(n, "_zod", {
            value: { def: r, constr: o, traits: new Set() },
            enumerable: !1,
          }),
        n._zod.traits.has(e))
      )
        return;
      n._zod.traits.add(e), t(n, r);
      const i = o.prototype,
        a = Object.keys(i);
      for (let e = 0; e < a.length; e++) {
        const t = a[e];
        t in n || (n[t] = i[t].bind(n));
      }
    }
    const i = n?.Parent ?? Object;
    class a extends i {}
    Object.defineProperty(a, "name", { value: e });
    function o(e) {
      var t;
      const i = n?.Parent ? new a() : this;
      r(i, e), (t = i._zod).deferred ?? (t.deferred = []);
      for (const e of i._zod.deferred) e();
      return i;
    }
    return (
      Object.defineProperty(o, "init", { value: r }),
      Object.defineProperty(o, Symbol.hasInstance, {
        value: (t) =>
          n?.Parent && t instanceof n.Parent ? !0 : t?._zod?.traits?.has(e),
      }),
      Object.defineProperty(o, "name", { value: e }),
      o
    );
  }
  var $t = class extends Error {
      constructor() {
        super(
          `Encountered Promise during synchronous parse. Use .parseAsync() instead.`,
        );
      }
    },
    en = class extends Error {
      constructor(e) {
        super(`Encountered unidirectional transform during encode: ${e}`),
          (this.name = `ZodEncodeError`);
      }
    };
  (Qt = globalThis).__zod_globalConfig ?? (Qt.__zod_globalConfig = {});
  var tn = globalThis.__zod_globalConfig;
  function nn(e) {
    return e && Object.assign(tn, e), tn;
  }
  function rn(e) {
    const t = Object.values(e).filter((e) => typeof e == `number`);
    return Object.entries(e)
      .filter(([e, n]) => t.indexOf(+e) === -1)
      .map(([e, t]) => t);
  }
  function an(e, t) {
    return typeof t == `bigint` ? t.toString() : t;
  }
  function on(e) {
    return {
      get value() {
        {
          const t = e();
          return Object.defineProperty(this, "value", { value: t }), t;
        }
        throw Error(`cached value already set`);
      },
    };
  }
  function sn(e) {
    return e == null;
  }
  function cn(e) {
    const t = +!!e.startsWith(`^`),
      n = e.endsWith(`$`) ? e.length - 1 : e.length;
    return e.slice(t, n);
  }
  function ln(e, t) {
    const n = e / t,
      r = Math.round(n),
      i = 2 ** -52 * Math.max(Math.abs(n), 1);
    return Math.abs(n - r) < i ? 0 : n - r;
  }
  var un = Symbol(`evaluating`);
  function j(e, t, n) {
    let r;
    Object.defineProperty(e, t, {
      get() {
        if (r !== un) return r === void 0 && ((r = un), (r = n())), r;
      },
      set(n) {
        Object.defineProperty(e, t, { value: n });
      },
      configurable: !0,
    });
  }
  function dn(e, t, n) {
    Object.defineProperty(e, t, {
      value: n,
      writable: !0,
      enumerable: !0,
      configurable: !0,
    });
  }
  function fn(...e) {
    const t = {};
    for (const n of e) {
      const e = Object.getOwnPropertyDescriptors(n);
      Object.assign(t, e);
    }
    return Object.defineProperties({}, t);
  }
  function pn(e) {
    return JSON.stringify(e);
  }
  function mn(e) {
    return e
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, ``)
      .replace(/[\s_-]+/g, `-`)
      .replace(/^-+|-+$/g, ``);
  }
  var hn =
    `captureStackTrace` in Error ? Error.captureStackTrace : (...e) => {};
  function gn(e) {
    return typeof e == `object` && !!e && !Array.isArray(e);
  }
  var _n = on(() => {
    if (
      tn.jitless ||
      (typeof navigator < `u` && navigator?.userAgent?.includes(`Cloudflare`))
    )
      return !1;
    try {
      return Function(``), !0;
    } catch {
      return !1;
    }
  });
  function vn(e) {
    if (gn(e) === !1) return !1;
    const t = e.constructor;
    if (t === void 0 || typeof t != `function`) return !0;
    const n = t.prototype;
    return !(gn(n) === !1 || Object.hasOwn(n, `isPrototypeOf`) === !1);
  }
  function yn(e) {
    return vn(e)
      ? { ...e }
      : Array.isArray(e)
        ? [...e]
        : e instanceof Map
          ? new Map(e)
          : e instanceof Set
            ? new Set(e)
            : e;
  }
  var bn = new Set([`string`, `number`, `symbol`]);
  function xn(e) {
    return e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
  }
  function Sn(e, t, n) {
    const r = new e._zod.constr(t ?? e._zod.def);
    return (!t || n?.parent) && (r._zod.parent = e), r;
  }
  function M(e) {
    const t = e;
    if (!t) return {};
    if (typeof t == `string`) return { error: () => t };
    if (t?.message !== void 0) {
      if (t?.error !== void 0)
        throw Error("Cannot specify both `message` and `error` params");
      t.error = t.message;
    }
    return (
      delete t.message,
      typeof t.error == `string` ? { ...t, error: () => t.error } : t
    );
  }
  function Cn(e) {
    return Object.keys(e).filter(
      (t) => e[t]._zod.optin === `optional` && e[t]._zod.optout === `optional`,
    );
  }
  var wn = {
    safeint: [-(2 ** 53 - 1), 2 ** 53 - 1],
    int32: [-2147483648, 2147483647],
    uint32: [0, 4294967295],
    float32: [-34028234663852886e22, 34028234663852886e22],
    float64: [-Number.MAX_VALUE, Number.MAX_VALUE],
  };
  function Tn(e, t) {
    const n = e._zod.def,
      r = n.checks;
    if (r && r.length > 0)
      throw Error(
        `.pick() cannot be used on object schemas containing refinements`,
      );
    return Sn(
      e,
      fn(e._zod.def, {
        get shape() {
          const e = {};
          for (const r in t) {
            if (!(r in n.shape)) throw Error(`Unrecognized key: "${r}"`);
            t[r] && (e[r] = n.shape[r]);
          }
          return dn(this, `shape`, e), e;
        },
        checks: [],
      }),
    );
  }
  function En(e, t) {
    const n = e._zod.def,
      r = n.checks;
    if (r && r.length > 0)
      throw Error(
        `.omit() cannot be used on object schemas containing refinements`,
      );
    return Sn(
      e,
      fn(e._zod.def, {
        get shape() {
          const r = { ...e._zod.def.shape };
          for (const e in t) {
            if (!(e in n.shape)) throw Error(`Unrecognized key: "${e}"`);
            t[e] && delete r[e];
          }
          return dn(this, `shape`, r), r;
        },
        checks: [],
      }),
    );
  }
  function Dn(e, t) {
    if (!vn(t)) throw Error(`Invalid input to extend: expected a plain object`);
    const n = e._zod.def.checks;
    if (n && n.length > 0) {
      const n = e._zod.def.shape;
      for (const e in t)
        if (Object.getOwnPropertyDescriptor(n, e) !== void 0)
          throw Error(
            "Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.",
          );
    }
    return Sn(
      e,
      fn(e._zod.def, {
        get shape() {
          const n = { ...e._zod.def.shape, ...t };
          return dn(this, `shape`, n), n;
        },
      }),
    );
  }
  function On(e, t) {
    if (!vn(t))
      throw Error(`Invalid input to safeExtend: expected a plain object`);
    return Sn(
      e,
      fn(e._zod.def, {
        get shape() {
          const n = { ...e._zod.def.shape, ...t };
          return dn(this, `shape`, n), n;
        },
      }),
    );
  }
  function kn(e, t) {
    if (e._zod.def.checks?.length)
      throw Error(
        `.merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.`,
      );
    return Sn(
      e,
      fn(e._zod.def, {
        get shape() {
          const n = { ...e._zod.def.shape, ...t._zod.def.shape };
          return dn(this, `shape`, n), n;
        },
        get catchall() {
          return t._zod.def.catchall;
        },
        checks: t._zod.def.checks ?? [],
      }),
    );
  }
  function An(e, t, n) {
    const r = t._zod.def.checks;
    if (r && r.length > 0)
      throw Error(
        `.partial() cannot be used on object schemas containing refinements`,
      );
    return Sn(
      t,
      fn(t._zod.def, {
        get shape() {
          const r = t._zod.def.shape,
            i = { ...r };
          if (n)
            for (const t in n) {
              if (!(t in r)) throw Error(`Unrecognized key: "${t}"`);
              n[t] &&
                (i[t] = e
                  ? new e({ type: `optional`, innerType: r[t] })
                  : r[t]);
            }
          else
            for (const t in r)
              i[t] = e ? new e({ type: `optional`, innerType: r[t] }) : r[t];
          return dn(this, `shape`, i), i;
        },
        checks: [],
      }),
    );
  }
  function jn(e, t, n) {
    return Sn(
      t,
      fn(t._zod.def, {
        get shape() {
          const r = t._zod.def.shape,
            i = { ...r };
          if (n)
            for (const t in n) {
              if (!(t in i)) throw Error(`Unrecognized key: "${t}"`);
              n[t] && (i[t] = new e({ type: `nonoptional`, innerType: r[t] }));
            }
          else
            for (const t in r)
              i[t] = new e({ type: `nonoptional`, innerType: r[t] });
          return dn(this, `shape`, i), i;
        },
      }),
    );
  }
  function Mn(e, t = 0) {
    if (e.aborted === !0) return !0;
    for (let n = t; n < e.issues.length; n++)
      if (e.issues[n]?.continue !== !0) return !0;
    return !1;
  }
  function Nn(e, t = 0) {
    if (e.aborted === !0) return !0;
    for (let n = t; n < e.issues.length; n++)
      if (e.issues[n]?.continue === !1) return !0;
    return !1;
  }
  function Pn(e, t) {
    return t.map((t) => {
      var n;
      return (n = t).path ?? (n.path = []), t.path.unshift(e), t;
    });
  }
  function Fn(e) {
    return typeof e == `string` ? e : e?.message;
  }
  function In(e, t, n) {
    const r = e.message
        ? e.message
        : (Fn(e.inst?._zod.def?.error?.(e)) ??
          Fn(t?.error?.(e)) ??
          Fn(n.customError?.(e)) ??
          Fn(n.localeError?.(e)) ??
          `Invalid input`),
      { inst: i, continue: a, input: o, ...s } = e;
    return (s.path ??= []), (s.message = r), t?.reportInput && (s.input = o), s;
  }
  function Ln(e) {
    return Array.isArray(e)
      ? `array`
      : typeof e == `string`
        ? `string`
        : `unknown`;
  }
  function Rn(...e) {
    const [t, n, r] = e;
    return typeof t == `string`
      ? { message: t, code: `custom`, input: n, inst: r }
      : { ...t };
  }
  var zn = (e, t) => {
      (e.name = `$ZodError`),
        Object.defineProperty(e, "_zod", { value: e._zod, enumerable: !1 }),
        Object.defineProperty(e, "issues", { value: t, enumerable: !1 }),
        (e.message = JSON.stringify(t, an, 2)),
        Object.defineProperty(e, "toString", {
          value: () => e.message,
          enumerable: !1,
        });
    },
    Bn = A(`$ZodError`, zn),
    Vn = A(`$ZodError`, zn, { Parent: Error });
  function Hn(e, t = (e) => e.message) {
    const n = {},
      r = [];
    for (const i of e.issues)
      i.path.length > 0
        ? ((n[i.path[0]] = n[i.path[0]] || []), n[i.path[0]].push(t(i)))
        : r.push(t(i));
    return { formErrors: r, fieldErrors: n };
  }
  function Un(e, t = (e) => e.message) {
    const n = { _errors: [] },
      r = (e, i = []) => {
        for (const a of e.issues)
          if (a.code === `invalid_union` && a.errors.length)
            a.errors.map((e) => r({ issues: e }, [...i, ...a.path]));
          else if (a.code === `invalid_key`)
            r({ issues: a.issues }, [...i, ...a.path]);
          else if (a.code === `invalid_element`)
            r({ issues: a.issues }, [...i, ...a.path]);
          else {
            const e = [...i, ...a.path];
            if (e.length === 0) n._errors.push(t(a));
            else {
              let r = n,
                i = 0;
              for (; i < e.length; ) {
                const n = e[i];
                i === e.length - 1
                  ? ((r[n] = r[n] || { _errors: [] }), r[n]._errors.push(t(a)))
                  : (r[n] = r[n] || { _errors: [] }),
                  (r = r[n]),
                  i++;
              }
            }
          }
      };
    return r(e), n;
  }
  var Wn = (e) => (t, n, r, i) => {
      const a = r ? { ...r, async: !1 } : { async: !1 },
        o = t._zod.run({ value: n, issues: [] }, a);
      if (o instanceof Promise) throw new $t();
      if (o.issues.length) {
        const t = new (i?.Err ?? e)(o.issues.map((e) => In(e, a, nn())));
        throw (hn(t, i?.callee), t);
      }
      return o.value;
    },
    Gn = (e) => async (t, n, r, i) => {
      let a = r ? { ...r, async: !0 } : { async: !0 },
        o = t._zod.run({ value: n, issues: [] }, a);
      if ((o instanceof Promise && (o = await o), o.issues.length)) {
        const t = new (i?.Err ?? e)(o.issues.map((e) => In(e, a, nn())));
        throw (hn(t, i?.callee), t);
      }
      return o.value;
    },
    Kn = (e) => (t, n, r) => {
      const i = r ? { ...r, async: !1 } : { async: !1 },
        a = t._zod.run({ value: n, issues: [] }, i);
      if (a instanceof Promise) throw new $t();
      return a.issues.length
        ? {
            success: !1,
            error: new (e ?? Bn)(a.issues.map((e) => In(e, i, nn()))),
          }
        : { success: !0, data: a.value };
    },
    qn = Kn(Vn),
    Jn = (e) => async (t, n, r) => {
      let i = r ? { ...r, async: !0 } : { async: !0 },
        a = t._zod.run({ value: n, issues: [] }, i);
      return (
        a instanceof Promise && (a = await a),
        a.issues.length
          ? { success: !1, error: new e(a.issues.map((e) => In(e, i, nn()))) }
          : { success: !0, data: a.value }
      );
    },
    Yn = Jn(Vn),
    Xn = (e) => (t, n, r) => {
      const i = r ? { ...r, direction: `backward` } : { direction: `backward` };
      return Wn(e)(t, n, i);
    },
    Zn = (e) => (t, n, r) => Wn(e)(t, n, r),
    Qn = (e) => async (t, n, r) => {
      const i = r ? { ...r, direction: `backward` } : { direction: `backward` };
      return Gn(e)(t, n, i);
    },
    $n = (e) => async (t, n, r) => Gn(e)(t, n, r),
    er = (e) => (t, n, r) => {
      const i = r ? { ...r, direction: `backward` } : { direction: `backward` };
      return Kn(e)(t, n, i);
    },
    tr = (e) => (t, n, r) => Kn(e)(t, n, r),
    nr = (e) => async (t, n, r) => {
      const i = r ? { ...r, direction: `backward` } : { direction: `backward` };
      return Jn(e)(t, n, i);
    },
    rr = (e) => async (t, n, r) => Jn(e)(t, n, r),
    ir = /^[cC][0-9a-z]{6,}$/,
    ar = /^[0-9a-z]+$/,
    or = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,
    sr = /^[0-9a-vA-V]{20}$/,
    cr = /^[A-Za-z0-9]{27}$/,
    lr = /^[a-zA-Z0-9_-]{21}$/,
    ur =
      /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
    dr =
      /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
    fr = (e) =>
      e
        ? RegExp(
            `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`,
          )
        : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
    pr =
      /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/,
    mr = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
  function hr() {
    return new RegExp(mr, `u`);
  }
  var gr =
      /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
    _r =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,
    vr =
      /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
    yr =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
    br =
      /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,
    xr = /^[A-Za-z0-9_-]*$/,
    Sr = /^https?$/,
    Cr = /^\+[1-9]\d{6,14}$/,
    wr = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`,
    Tr = RegExp(`^${wr}$`);
  function Er(e) {
    const t = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
    return typeof e.precision == `number`
      ? e.precision === -1
        ? `${t}`
        : e.precision === 0
          ? `${t}:[0-5]\\d`
          : `${t}:[0-5]\\d\\.\\d{${e.precision}}`
      : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  }
  function Dr(e) {
    return RegExp(`^${Er(e)}$`);
  }
  function Or(e) {
    const t = Er({ precision: e.precision }),
      n = [`Z`];
    e.local && n.push(``),
      e.offset && n.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
    const r = `${t}(?:${n.join(`|`)})`;
    return RegExp(`^${wr}T(?:${r})$`);
  }
  var kr = (e) => {
      const t = e
        ? `[\\s\\S]{${e?.minimum ?? 0},${e?.maximum ?? ``}}`
        : `[\\s\\S]*`;
      return RegExp(`^${t}$`);
    },
    Ar = /^-?\d+$/,
    jr = /^-?\d+(?:\.\d+)?$/,
    Mr = /^(?:true|false)$/i,
    Nr = /^null$/i,
    Pr = /^[^A-Z]*$/,
    Fr = /^[^a-z]*$/,
    Ir = A(`$ZodCheck`, (e, t) => {
      var n;
      (e._zod ??= {}),
        (e._zod.def = t),
        (n = e._zod).onattach ?? (n.onattach = []);
    }),
    Lr = { number: `number`, bigint: `bigint`, object: `date` },
    Rr = A(`$ZodCheckLessThan`, (e, t) => {
      Ir.init(e, t);
      const n = Lr[typeof t.value];
      e._zod.onattach.push((e) => {
        const n = e._zod.bag,
          r = (t.inclusive ? n.maximum : n.exclusiveMaximum) ?? 1 / 0;
        t.value < r &&
          (t.inclusive
            ? (n.maximum = t.value)
            : (n.exclusiveMaximum = t.value));
      }),
        (e._zod.check = (r) => {
          (t.inclusive ? r.value <= t.value : r.value < t.value) ||
            r.issues.push({
              origin: n,
              code: `too_big`,
              maximum: typeof t.value == `object` ? t.value.getTime() : t.value,
              input: r.value,
              inclusive: t.inclusive,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    zr = A(`$ZodCheckGreaterThan`, (e, t) => {
      Ir.init(e, t);
      const n = Lr[typeof t.value];
      e._zod.onattach.push((e) => {
        const n = e._zod.bag,
          r = (t.inclusive ? n.minimum : n.exclusiveMinimum) ?? -1 / 0;
        t.value > r &&
          (t.inclusive
            ? (n.minimum = t.value)
            : (n.exclusiveMinimum = t.value));
      }),
        (e._zod.check = (r) => {
          (t.inclusive ? r.value >= t.value : r.value > t.value) ||
            r.issues.push({
              origin: n,
              code: `too_small`,
              minimum: typeof t.value == `object` ? t.value.getTime() : t.value,
              input: r.value,
              inclusive: t.inclusive,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    Br = A(`$ZodCheckMultipleOf`, (e, t) => {
      Ir.init(e, t),
        e._zod.onattach.push((e) => {
          var n;
          (n = e._zod.bag).multipleOf ?? (n.multipleOf = t.value);
        }),
        (e._zod.check = (n) => {
          if (typeof n.value != typeof t.value)
            throw Error(`Cannot mix number and bigint in multiple_of check.`);
          (typeof n.value == `bigint`
            ? n.value % t.value === BigInt(0)
            : ln(n.value, t.value) === 0) ||
            n.issues.push({
              origin: typeof n.value,
              code: `not_multiple_of`,
              divisor: t.value,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    Vr = A(`$ZodCheckNumberFormat`, (e, t) => {
      Ir.init(e, t), (t.format = t.format || `float64`);
      const n = t.format?.includes(`int`),
        r = n ? `int` : `number`,
        [i, a] = wn[t.format];
      e._zod.onattach.push((e) => {
        const r = e._zod.bag;
        (r.format = t.format),
          (r.minimum = i),
          (r.maximum = a),
          n && (r.pattern = Ar);
      }),
        (e._zod.check = (o) => {
          const s = o.value;
          if (n) {
            if (!Number.isInteger(s)) {
              o.issues.push({
                expected: r,
                format: t.format,
                code: `invalid_type`,
                continue: !1,
                input: s,
                inst: e,
              });
              return;
            }
            if (!Number.isSafeInteger(s)) {
              s > 0
                ? o.issues.push({
                    input: s,
                    code: `too_big`,
                    maximum: 2 ** 53 - 1,
                    note: `Integers must be within the safe integer range.`,
                    inst: e,
                    origin: r,
                    inclusive: !0,
                    continue: !t.abort,
                  })
                : o.issues.push({
                    input: s,
                    code: `too_small`,
                    minimum: -(2 ** 53 - 1),
                    note: `Integers must be within the safe integer range.`,
                    inst: e,
                    origin: r,
                    inclusive: !0,
                    continue: !t.abort,
                  });
              return;
            }
          }
          s < i &&
            o.issues.push({
              origin: `number`,
              input: s,
              code: `too_small`,
              minimum: i,
              inclusive: !0,
              inst: e,
              continue: !t.abort,
            }),
            s > a &&
              o.issues.push({
                origin: `number`,
                input: s,
                code: `too_big`,
                maximum: a,
                inclusive: !0,
                inst: e,
                continue: !t.abort,
              });
        });
    }),
    Hr = A(`$ZodCheckMaxLength`, (e, t) => {
      var n;
      Ir.init(e, t),
        (n = e._zod.def).when ??
          (n.when = (e) => {
            const t = e.value;
            return !sn(t) && t.length !== void 0;
          }),
        e._zod.onattach.push((e) => {
          const n = e._zod.bag.maximum ?? 1 / 0;
          t.maximum < n && (e._zod.bag.maximum = t.maximum);
        }),
        (e._zod.check = (n) => {
          const r = n.value;
          if (r.length <= t.maximum) return;
          const i = Ln(r);
          n.issues.push({
            origin: i,
            code: `too_big`,
            maximum: t.maximum,
            inclusive: !0,
            input: r,
            inst: e,
            continue: !t.abort,
          });
        });
    }),
    Ur = A(`$ZodCheckMinLength`, (e, t) => {
      var n;
      Ir.init(e, t),
        (n = e._zod.def).when ??
          (n.when = (e) => {
            const t = e.value;
            return !sn(t) && t.length !== void 0;
          }),
        e._zod.onattach.push((e) => {
          const n = e._zod.bag.minimum ?? -1 / 0;
          t.minimum > n && (e._zod.bag.minimum = t.minimum);
        }),
        (e._zod.check = (n) => {
          const r = n.value;
          if (r.length >= t.minimum) return;
          const i = Ln(r);
          n.issues.push({
            origin: i,
            code: `too_small`,
            minimum: t.minimum,
            inclusive: !0,
            input: r,
            inst: e,
            continue: !t.abort,
          });
        });
    }),
    Wr = A(`$ZodCheckLengthEquals`, (e, t) => {
      var n;
      Ir.init(e, t),
        (n = e._zod.def).when ??
          (n.when = (e) => {
            const t = e.value;
            return !sn(t) && t.length !== void 0;
          }),
        e._zod.onattach.push((e) => {
          const n = e._zod.bag;
          (n.minimum = t.length), (n.maximum = t.length), (n.length = t.length);
        }),
        (e._zod.check = (n) => {
          const r = n.value,
            i = r.length;
          if (i === t.length) return;
          const a = Ln(r),
            o = i > t.length;
          n.issues.push({
            origin: a,
            ...(o
              ? { code: `too_big`, maximum: t.length }
              : { code: `too_small`, minimum: t.length }),
            inclusive: !0,
            exact: !0,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
        });
    }),
    Gr = A(`$ZodCheckStringFormat`, (e, t) => {
      var n, r;
      Ir.init(e, t),
        e._zod.onattach.push((e) => {
          const n = e._zod.bag;
          (n.format = t.format),
            t.pattern &&
              ((n.patterns ??= new Set()), n.patterns.add(t.pattern));
        }),
        t.pattern
          ? ((n = e._zod).check ??
            (n.check = (n) => {
              (t.pattern.lastIndex = 0),
                !t.pattern.test(n.value) &&
                  n.issues.push({
                    origin: `string`,
                    code: `invalid_format`,
                    format: t.format,
                    input: n.value,
                    ...(t.pattern ? { pattern: t.pattern.toString() } : {}),
                    inst: e,
                    continue: !t.abort,
                  });
            }))
          : ((r = e._zod).check ?? (r.check = () => {}));
    }),
    Kr = A(`$ZodCheckRegex`, (e, t) => {
      Gr.init(e, t),
        (e._zod.check = (n) => {
          (t.pattern.lastIndex = 0),
            !t.pattern.test(n.value) &&
              n.issues.push({
                origin: `string`,
                code: `invalid_format`,
                format: `regex`,
                input: n.value,
                pattern: t.pattern.toString(),
                inst: e,
                continue: !t.abort,
              });
        });
    }),
    qr = A(`$ZodCheckLowerCase`, (e, t) => {
      (t.pattern ??= Pr), Gr.init(e, t);
    }),
    Jr = A(`$ZodCheckUpperCase`, (e, t) => {
      (t.pattern ??= Fr), Gr.init(e, t);
    }),
    Yr = A(`$ZodCheckIncludes`, (e, t) => {
      Ir.init(e, t);
      const n = xn(t.includes),
        r = new RegExp(
          typeof t.position == `number` ? `^.{${t.position}}${n}` : n,
        );
      (t.pattern = r),
        e._zod.onattach.push((e) => {
          const t = e._zod.bag;
          (t.patterns ??= new Set()), t.patterns.add(r);
        }),
        (e._zod.check = (n) => {
          n.value.includes(t.includes, t.position) ||
            n.issues.push({
              origin: `string`,
              code: `invalid_format`,
              format: `includes`,
              includes: t.includes,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    Xr = A(`$ZodCheckStartsWith`, (e, t) => {
      Ir.init(e, t);
      const n = RegExp(`^${xn(t.prefix)}.*`);
      (t.pattern ??= n),
        e._zod.onattach.push((e) => {
          const t = e._zod.bag;
          (t.patterns ??= new Set()), t.patterns.add(n);
        }),
        (e._zod.check = (n) => {
          n.value.startsWith(t.prefix) ||
            n.issues.push({
              origin: `string`,
              code: `invalid_format`,
              format: `starts_with`,
              prefix: t.prefix,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    Zr = A(`$ZodCheckEndsWith`, (e, t) => {
      Ir.init(e, t);
      const n = RegExp(`.*${xn(t.suffix)}$`);
      (t.pattern ??= n),
        e._zod.onattach.push((e) => {
          const t = e._zod.bag;
          (t.patterns ??= new Set()), t.patterns.add(n);
        }),
        (e._zod.check = (n) => {
          n.value.endsWith(t.suffix) ||
            n.issues.push({
              origin: `string`,
              code: `invalid_format`,
              format: `ends_with`,
              suffix: t.suffix,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    Qr = A(`$ZodCheckOverwrite`, (e, t) => {
      Ir.init(e, t),
        (e._zod.check = (e) => {
          e.value = t.tx(e.value);
        });
    }),
    $r = class {
      constructor(e = []) {
        (this.content = []), (this.indent = 0), this && (this.args = e);
      }
      indented(e) {
        (this.indent += 1), e(this), --this.indent;
      }
      write(e) {
        if (typeof e == `function`) {
          e(this, { execution: `sync` }), e(this, { execution: `async` });
          return;
        }
        const t = e
            .split(`
`)
            .filter((e) => e),
          n = Math.min(...t.map((e) => e.length - e.trimStart().length)),
          r = t
            .map((e) => e.slice(n))
            .map((e) => ` `.repeat(this.indent * 2) + e);
        for (const e of r) this.content.push(e);
      }
      compile() {
        const e = Function,
          t = this?.args,
          n = [...(this?.content ?? [``]).map((e) => `  ${e}`)];
        return new e(
          ...t,
          n.join(`
`),
        );
      }
    },
    ei = { major: 4, minor: 4, patch: 3 },
    N = A(`$ZodType`, (e, t) => {
      var n;
      (e ??= {}),
        (e._zod.def = t),
        (e._zod.bag = e._zod.bag || {}),
        (e._zod.version = ei);
      const r = [...(e._zod.def.checks ?? [])];
      e._zod.traits.has(`$ZodCheck`) && r.unshift(e);
      for (const t of r) for (const n of t._zod.onattach) n(e);
      if (r.length === 0)
        (n = e._zod).deferred ?? (n.deferred = []),
          e._zod.deferred?.push(() => {
            e._zod.run = e._zod.parse;
          });
      else {
        const t = (e, t, n) => {
            let r = Mn(e),
              i;
            for (const a of t) {
              if (a._zod.def.when) {
                if (Nn(e) || !a._zod.def.when(e)) continue;
              } else if (r) continue;
              const t = e.issues.length,
                o = a._zod.check(e);
              if (o instanceof Promise && n?.async === !1) throw new $t();
              if (i || o instanceof Promise)
                i = (i ?? Promise.resolve()).then(async () => {
                  await o, e.issues.length !== t && (r ||= Mn(e, t));
                });
              else {
                if (e.issues.length === t) continue;
                r ||= Mn(e, t);
              }
            }
            return i ? i.then(() => e) : e;
          },
          n = (n, i, a) => {
            if (Mn(n)) return (n.aborted = !0), n;
            const o = t(i, r, a);
            if (o instanceof Promise) {
              if (a.async === !1) throw new $t();
              return o.then((t) => e._zod.parse(t, a));
            }
            return e._zod.parse(o, a);
          };
        e._zod.run = (i, a) => {
          if (a.skipChecks) return e._zod.parse(i, a);
          if (a.direction === `backward`) {
            const t = e._zod.parse(
              { value: i.value, issues: [] },
              { ...a, skipChecks: !0 },
            );
            return t instanceof Promise
              ? t.then((e) => n(e, i, a))
              : n(t, i, a);
          }
          const o = e._zod.parse(i, a);
          if (o instanceof Promise) {
            if (a.async === !1) throw new $t();
            return o.then((e) => t(e, r, a));
          }
          return t(o, r, a);
        };
      }
      j(e, `~standard`, () => ({
        validate: (t) => {
          try {
            const n = qn(e, t);
            return n.success ? { value: n.data } : { issues: n.error?.issues };
          } catch {
            return Yn(e, t).then((e) =>
              e.success ? { value: e.data } : { issues: e.error?.issues },
            );
          }
        },
        vendor: `zod`,
        version: 1,
      }));
    }),
    ti = A(`$ZodString`, (e, t) => {
      N.init(e, t),
        (e._zod.pattern =
          [...(e?._zod.bag?.patterns ?? [])].pop() ?? kr(e._zod.bag)),
        (e._zod.parse = (n, r) => {
          if (t.coerce)
            try {
              n.value = String(n.value);
            } catch {}
          return (
            typeof n.value == `string` ||
              n.issues.push({
                expected: `string`,
                code: `invalid_type`,
                input: n.value,
                inst: e,
              }),
            n
          );
        });
    }),
    P = A(`$ZodStringFormat`, (e, t) => {
      Gr.init(e, t), ti.init(e, t);
    }),
    ni = A(`$ZodGUID`, (e, t) => {
      (t.pattern ??= dr), P.init(e, t);
    }),
    ri = A(`$ZodUUID`, (e, t) => {
      if (t.version) {
        const e = { v1: 1, v2: 2, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7, v8: 8 }[
          t.version
        ];
        if (e === void 0) throw Error(`Invalid UUID version: "${t.version}"`);
        t.pattern ??= fr(e);
      } else t.pattern ??= fr();
      P.init(e, t);
    }),
    ii = A(`$ZodEmail`, (e, t) => {
      (t.pattern ??= pr), P.init(e, t);
    }),
    ai = A(`$ZodURL`, (e, t) => {
      P.init(e, t),
        (e._zod.check = (n) => {
          try {
            const r = n.value.trim();
            if (
              !t.normalize &&
              t.protocol?.source === Sr.source &&
              !/^https?:\/\//i.test(r)
            ) {
              n.issues.push({
                code: `invalid_format`,
                format: `url`,
                note: `Invalid URL format`,
                input: n.value,
                inst: e,
                continue: !t.abort,
              });
              return;
            }
            const i = new URL(r);
            t.hostname &&
              ((t.hostname.lastIndex = 0),
              t.hostname.test(i.hostname) ||
                n.issues.push({
                  code: `invalid_format`,
                  format: `url`,
                  note: `Invalid hostname`,
                  pattern: t.hostname.source,
                  input: n.value,
                  inst: e,
                  continue: !t.abort,
                })),
              t.protocol &&
                ((t.protocol.lastIndex = 0),
                t.protocol.test(
                  i.protocol.endsWith(`:`)
                    ? i.protocol.slice(0, -1)
                    : i.protocol,
                ) ||
                  n.issues.push({
                    code: `invalid_format`,
                    format: `url`,
                    note: `Invalid protocol`,
                    pattern: t.protocol.source,
                    input: n.value,
                    inst: e,
                    continue: !t.abort,
                  })),
              t.normalize ? (n.value = i.href) : (n.value = r);
            return;
          } catch {
            n.issues.push({
              code: `invalid_format`,
              format: `url`,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
          }
        });
    }),
    oi = A(`$ZodEmoji`, (e, t) => {
      (t.pattern ??= hr()), P.init(e, t);
    }),
    si = A(`$ZodNanoID`, (e, t) => {
      (t.pattern ??= lr), P.init(e, t);
    }),
    ci = A(`$ZodCUID`, (e, t) => {
      (t.pattern ??= ir), P.init(e, t);
    }),
    li = A(`$ZodCUID2`, (e, t) => {
      (t.pattern ??= ar), P.init(e, t);
    }),
    ui = A(`$ZodULID`, (e, t) => {
      (t.pattern ??= or), P.init(e, t);
    }),
    di = A(`$ZodXID`, (e, t) => {
      (t.pattern ??= sr), P.init(e, t);
    }),
    fi = A(`$ZodKSUID`, (e, t) => {
      (t.pattern ??= cr), P.init(e, t);
    }),
    pi = A(`$ZodISODateTime`, (e, t) => {
      (t.pattern ??= Or(t)), P.init(e, t);
    }),
    mi = A(`$ZodISODate`, (e, t) => {
      (t.pattern ??= Tr), P.init(e, t);
    }),
    hi = A(`$ZodISOTime`, (e, t) => {
      (t.pattern ??= Dr(t)), P.init(e, t);
    }),
    gi = A(`$ZodISODuration`, (e, t) => {
      (t.pattern ??= ur), P.init(e, t);
    }),
    _i = A(`$ZodIPv4`, (e, t) => {
      (t.pattern ??= gr), P.init(e, t), (e._zod.bag.format = `ipv4`);
    }),
    vi = A(`$ZodIPv6`, (e, t) => {
      (t.pattern ??= _r),
        P.init(e, t),
        (e._zod.bag.format = `ipv6`),
        (e._zod.check = (n) => {
          try {
            new URL(`http://[${n.value}]`);
          } catch {
            n.issues.push({
              code: `invalid_format`,
              format: `ipv6`,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
          }
        });
    }),
    yi = A(`$ZodCIDRv4`, (e, t) => {
      (t.pattern ??= vr), P.init(e, t);
    }),
    bi = A(`$ZodCIDRv6`, (e, t) => {
      (t.pattern ??= yr),
        P.init(e, t),
        (e._zod.check = (n) => {
          const r = n.value.split(`/`);
          try {
            if (r.length !== 2) throw Error();
            const [e, t] = r;
            if (!t) throw Error();
            const n = Number(t);
            if (`${n}` !== t || n < 0 || n > 128) throw Error();
            new URL(`http://[${e}]`);
          } catch {
            n.issues.push({
              code: `invalid_format`,
              format: `cidrv6`,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
          }
        });
    });
  function xi(e) {
    if (e === ``) return !0;
    if (/\s/.test(e) || e.length % 4 != 0) return !1;
    try {
      return atob(e), !0;
    } catch {
      return !1;
    }
  }
  var Si = A(`$ZodBase64`, (e, t) => {
    (t.pattern ??= br),
      P.init(e, t),
      (e._zod.bag.contentEncoding = `base64`),
      (e._zod.check = (n) => {
        xi(n.value) ||
          n.issues.push({
            code: `invalid_format`,
            format: `base64`,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
      });
  });
  function Ci(e) {
    if (!xr.test(e)) return !1;
    const t = e.replace(/[-_]/g, (e) => (e === `-` ? `+` : `/`));
    return xi(t.padEnd(Math.ceil(t.length / 4) * 4, `=`));
  }
  var wi = A(`$ZodBase64URL`, (e, t) => {
      (t.pattern ??= xr),
        P.init(e, t),
        (e._zod.bag.contentEncoding = `base64url`),
        (e._zod.check = (n) => {
          Ci(n.value) ||
            n.issues.push({
              code: `invalid_format`,
              format: `base64url`,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    Ti = A(`$ZodE164`, (e, t) => {
      (t.pattern ??= Cr), P.init(e, t);
    });
  function Ei(e, t = null) {
    try {
      const n = e.split(`.`);
      if (n.length !== 3) return !1;
      const [r] = n;
      if (!r) return !1;
      const i = JSON.parse(atob(r));
      return !(
        (`typ` in i && i?.typ !== `JWT`) ||
        !i.alg ||
        (t && (!(`alg` in i) || i.alg !== t))
      );
    } catch {
      return !1;
    }
  }
  var Di = A(`$ZodJWT`, (e, t) => {
      P.init(e, t),
        (e._zod.check = (n) => {
          Ei(n.value, t.alg) ||
            n.issues.push({
              code: `invalid_format`,
              format: `jwt`,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    Oi = A(`$ZodNumber`, (e, t) => {
      N.init(e, t),
        (e._zod.pattern = e._zod.bag.pattern ?? jr),
        (e._zod.parse = (n, r) => {
          if (t.coerce)
            try {
              n.value = Number(n.value);
            } catch {}
          const i = n.value;
          if (typeof i == `number` && !Number.isNaN(i) && Number.isFinite(i))
            return n;
          const a =
            typeof i == `number`
              ? Number.isNaN(i)
                ? `NaN`
                : Number.isFinite(i)
                  ? void 0
                  : `Infinity`
              : void 0;
          return (
            n.issues.push({
              expected: `number`,
              code: `invalid_type`,
              input: i,
              inst: e,
              ...(a ? { received: a } : {}),
            }),
            n
          );
        });
    }),
    ki = A(`$ZodNumberFormat`, (e, t) => {
      Vr.init(e, t), Oi.init(e, t);
    }),
    Ai = A(`$ZodBoolean`, (e, t) => {
      N.init(e, t),
        (e._zod.pattern = Mr),
        (e._zod.parse = (n, r) => {
          if (t.coerce)
            try {
              n.value = !!n.value;
            } catch {}
          const i = n.value;
          return (
            typeof i == `boolean` ||
              n.issues.push({
                expected: `boolean`,
                code: `invalid_type`,
                input: i,
                inst: e,
              }),
            n
          );
        });
    }),
    ji = A(`$ZodNull`, (e, t) => {
      N.init(e, t),
        (e._zod.pattern = Nr),
        (e._zod.values = new Set([null])),
        (e._zod.parse = (t, n) => {
          const r = t.value;
          return (
            r === null ||
              t.issues.push({
                expected: `null`,
                code: `invalid_type`,
                input: r,
                inst: e,
              }),
            t
          );
        });
    }),
    Mi = A(`$ZodUnknown`, (e, t) => {
      N.init(e, t), (e._zod.parse = (e) => e);
    }),
    Ni = A(`$ZodNever`, (e, t) => {
      N.init(e, t),
        (e._zod.parse = (t, n) => (
          t.issues.push({
            expected: `never`,
            code: `invalid_type`,
            input: t.value,
            inst: e,
          }),
          t
        ));
    });
  function Pi(e, t, n) {
    e.issues.length && t.issues.push(...Pn(n, e.issues)),
      (t.value[n] = e.value);
  }
  var Fi = A(`$ZodArray`, (e, t) => {
    N.init(e, t),
      (e._zod.parse = (n, r) => {
        const i = n.value;
        if (!Array.isArray(i))
          return (
            n.issues.push({
              expected: `array`,
              code: `invalid_type`,
              input: i,
              inst: e,
            }),
            n
          );
        n.value = Array(i.length);
        const a = [];
        for (let e = 0; e < i.length; e++) {
          const o = i[e],
            s = t.element._zod.run({ value: o, issues: [] }, r);
          s instanceof Promise
            ? a.push(s.then((t) => Pi(t, n, e)))
            : Pi(s, n, e);
        }
        return a.length ? Promise.all(a).then(() => n) : n;
      });
  });
  function Ii(e, t, n, r, i, a) {
    const o = n in r;
    if (e.issues.length) {
      if (i && a && !o) return;
      t.issues.push(...Pn(n, e.issues));
    }
    if (!o && !i) {
      e.issues.length ||
        t.issues.push({
          code: `invalid_type`,
          expected: `nonoptional`,
          input: void 0,
          path: [n],
        });
      return;
    }
    e.value === void 0 ? o && (t.value[n] = void 0) : (t.value[n] = e.value);
  }
  function Li(e) {
    const t = Object.keys(e.shape);
    for (const n of t)
      if (!e.shape?.[n]?._zod?.traits?.has(`$ZodType`))
        throw Error(`Invalid element at key "${n}": expected a Zod schema`);
    const n = Cn(e.shape);
    return {
      ...e,
      keys: t,
      keySet: new Set(t),
      numKeys: t.length,
      optionalKeys: new Set(n),
    };
  }
  function F(e, t, n, r, i, a) {
    const o = [],
      s = i.keySet,
      c = i.catchall._zod,
      l = c.def.type,
      u = c.optin === `optional`,
      d = c.optout === `optional`;
    for (const i in t) {
      if (i === `__proto__` || s.has(i)) continue;
      if (l === `never`) {
        o.push(i);
        continue;
      }
      const a = c.run({ value: t[i], issues: [] }, r);
      a instanceof Promise
        ? e.push(a.then((e) => Ii(e, n, i, t, u, d)))
        : Ii(a, n, i, t, u, d);
    }
    return (
      o.length &&
        n.issues.push({
          code: `unrecognized_keys`,
          keys: o,
          input: t,
          inst: a,
        }),
      e.length ? Promise.all(e).then(() => n) : n
    );
  }
  var I = A(`$ZodObject`, (e, t) => {
      if ((N.init(e, t), !Object.getOwnPropertyDescriptor(t, `shape`)?.get)) {
        const e = t.shape;
        Object.defineProperty(t, "shape", {
          get: () => {
            const n = { ...e };
            return Object.defineProperty(t, "shape", { value: n }), n;
          },
        });
      }
      const n = on(() => Li(t));
      j(e._zod, `propValues`, () => {
        const e = t.shape,
          n = {};
        for (const t in e) {
          const r = e[t]._zod;
          if (r.values) {
            n[t] ?? (n[t] = new Set());
            for (const e of r.values) n[t].add(e);
          }
        }
        return n;
      });
      let r = gn,
        i = t.catchall,
        a;
      e._zod.parse = (t, o) => {
        a ??= n.value;
        const s = t.value;
        if (!r(s))
          return (
            t.issues.push({
              expected: `object`,
              code: `invalid_type`,
              input: s,
              inst: e,
            }),
            t
          );
        t.value = {};
        const c = [],
          l = a.shape;
        for (const e of a.keys) {
          const n = l[e],
            r = n._zod.optin === `optional`,
            i = n._zod.optout === `optional`,
            a = n._zod.run({ value: s[e], issues: [] }, o);
          a instanceof Promise
            ? c.push(a.then((n) => Ii(n, t, e, s, r, i)))
            : Ii(a, t, e, s, r, i);
        }
        return i
          ? F(c, s, t, o, n.value, e)
          : c.length
            ? Promise.all(c).then(() => t)
            : t;
      };
    }),
    Ri = A(`$ZodObjectJIT`, (e, t) => {
      I.init(e, t);
      let n = e._zod.parse,
        r = on(() => Li(t)),
        i = (e) => {
          const t = new $r([`shape`, `payload`, `ctx`]),
            n = r.value,
            i = (e) => {
              const t = pn(e);
              return `shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`;
            };
          t.write(`const input = payload.value;`);
          let a = Object.create(null),
            o = 0;
          for (const e of n.keys) a[e] = `key_${o++}`;
          t.write(`const newResult = {};`);
          for (const r of n.keys) {
            const n = a[r],
              o = pn(r),
              s = e[r],
              c = s?._zod?.optin === `optional`,
              l = s?._zod?.optout === `optional`;
            t.write(`const ${n} = ${i(r)};`),
              c && l
                ? t.write(`
        if (${n}.issues.length) {
          if (${o} in input) {
            payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${o}, ...iss.path] : [${o}]
            })));
          }
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `)
                : c
                  ? t.write(`
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        
        if (${n}.value === undefined) {
          if (${o} in input) {
            newResult[${o}] = undefined;
          }
        } else {
          newResult[${o}] = ${n}.value;
        }
        
      `)
                  : t.write(`
        const ${n}_present = ${o} in input;
        if (${n}.issues.length) {
          payload.issues = payload.issues.concat(${n}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${o}, ...iss.path] : [${o}]
          })));
        }
        if (!${n}_present && !${n}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${o}]
          });
        }

        if (${n}_present) {
          if (${n}.value === undefined) {
            newResult[${o}] = undefined;
          } else {
            newResult[${o}] = ${n}.value;
          }
        }

      `);
          }
          t.write(`payload.value = newResult;`), t.write(`return payload;`);
          const s = t.compile();
          return (t, n) => s(e, t, n);
        },
        a,
        o = gn,
        s = !tn.jitless,
        c = s && _n.value,
        l = t.catchall,
        u;
      e._zod.parse = (d, f) => {
        u ??= r.value;
        const p = d.value;
        return o(p)
          ? s && c && f?.async === !1 && f.jitless !== !0
            ? ((a ||= i(t.shape)), (d = a(d, f)), l ? F([], p, d, f, u, e) : d)
            : n(d, f)
          : (d.issues.push({
              expected: `object`,
              code: `invalid_type`,
              input: p,
              inst: e,
            }),
            d);
      };
    });
  function zi(e, t, n, r) {
    for (const n of e) if (n.issues.length === 0) return (t.value = n.value), t;
    const i = e.filter((e) => !Mn(e));
    return i.length === 1
      ? ((t.value = i[0].value), i[0])
      : (t.issues.push({
          code: `invalid_union`,
          input: t.value,
          inst: n,
          errors: e.map((e) => e.issues.map((e) => In(e, r, nn()))),
        }),
        t);
  }
  var Bi = A(`$ZodUnion`, (e, t) => {
      N.init(e, t),
        j(e._zod, `optin`, () =>
          t.options.some((e) => e._zod.optin === `optional`)
            ? `optional`
            : void 0,
        ),
        j(e._zod, `optout`, () =>
          t.options.some((e) => e._zod.optout === `optional`)
            ? `optional`
            : void 0,
        ),
        j(e._zod, `values`, () => {
          if (t.options.every((e) => e._zod.values))
            return new Set(t.options.flatMap((e) => Array.from(e._zod.values)));
        }),
        j(e._zod, `pattern`, () => {
          if (t.options.every((e) => e._zod.pattern)) {
            const e = t.options.map((e) => e._zod.pattern);
            return RegExp(`^(${e.map((e) => cn(e.source)).join(`|`)})$`);
          }
        });
      const n = t.options.length === 1 ? t.options[0]._zod.run : null;
      e._zod.parse = (r, i) => {
        if (n) return n(r, i);
        let a = !1,
          o = [];
        for (const e of t.options) {
          const t = e._zod.run({ value: r.value, issues: [] }, i);
          if (t instanceof Promise) o.push(t), (a = !0);
          else {
            if (t.issues.length === 0) return t;
            o.push(t);
          }
        }
        return a ? Promise.all(o).then((t) => zi(t, r, e, i)) : zi(o, r, e, i);
      };
    }),
    Vi = A(`$ZodDiscriminatedUnion`, (e, t) => {
      (t.inclusive = !1), Bi.init(e, t);
      const n = e._zod.parse;
      j(e._zod, `propValues`, () => {
        const e = {};
        for (const n of t.options) {
          const r = n._zod.propValues;
          if (!r || Object.keys(r).length === 0)
            throw Error(
              `Invalid discriminated union option at index "${t.options.indexOf(n)}"`,
            );
          for (const [t, n] of Object.entries(r)) {
            e[t] || (e[t] = new Set());
            for (const r of n) e[t].add(r);
          }
        }
        return e;
      });
      const r = on(() => {
        const e = t.options,
          n = new Map();
        for (const r of e) {
          const e = r._zod.propValues?.[t.discriminator];
          if (!e || e.size === 0)
            throw Error(
              `Invalid discriminated union option at index "${t.options.indexOf(r)}"`,
            );
          for (const t of e) {
            if (n.has(t))
              throw Error(`Duplicate discriminator value "${String(t)}"`);
            n.set(t, r);
          }
        }
        return n;
      });
      e._zod.parse = (i, a) => {
        const o = i.value;
        if (!gn(o))
          return (
            i.issues.push({
              code: `invalid_type`,
              expected: `object`,
              input: o,
              inst: e,
            }),
            i
          );
        const s = r.value.get(o?.[t.discriminator]);
        return s
          ? s._zod.run(i, a)
          : t.unionFallback || a.direction === `backward`
            ? n(i, a)
            : (i.issues.push({
                code: `invalid_union`,
                errors: [],
                note: `No matching discriminator`,
                discriminator: t.discriminator,
                options: Array.from(r.value.keys()),
                input: o,
                path: [t.discriminator],
                inst: e,
              }),
              i);
      };
    }),
    Hi = A(`$ZodIntersection`, (e, t) => {
      N.init(e, t),
        (e._zod.parse = (e, n) => {
          const r = e.value,
            i = t.left._zod.run({ value: r, issues: [] }, n),
            a = t.right._zod.run({ value: r, issues: [] }, n);
          return i instanceof Promise || a instanceof Promise
            ? Promise.all([i, a]).then(([t, n]) => Wi(e, t, n))
            : Wi(e, i, a);
        });
    });
  function Ui(e, t) {
    if (e === t || (e instanceof Date && t instanceof Date && +e == +t))
      return { valid: !0, data: e };
    if (vn(e) && vn(t)) {
      const n = Object.keys(t),
        r = Object.keys(e).filter((e) => n.indexOf(e) !== -1),
        i = { ...e, ...t };
      for (const n of r) {
        const r = Ui(e[n], t[n]);
        if (!r.valid)
          return { valid: !1, mergeErrorPath: [n, ...r.mergeErrorPath] };
        i[n] = r.data;
      }
      return { valid: !0, data: i };
    }
    if (Array.isArray(e) && Array.isArray(t)) {
      if (e.length !== t.length) return { valid: !1, mergeErrorPath: [] };
      const n = [];
      for (let r = 0; r < e.length; r++) {
        const i = e[r],
          a = t[r],
          o = Ui(i, a);
        if (!o.valid)
          return { valid: !1, mergeErrorPath: [r, ...o.mergeErrorPath] };
        n.push(o.data);
      }
      return { valid: !0, data: n };
    }
    return { valid: !1, mergeErrorPath: [] };
  }
  function Wi(e, t, n) {
    let r = new Map(),
      i;
    for (const n of t.issues)
      if (n.code === `unrecognized_keys`) {
        i ??= n;
        for (const e of n.keys) r.has(e) || r.set(e, {}), (r.get(e).l = !0);
      } else e.issues.push(n);
    for (const t of n.issues)
      if (t.code === `unrecognized_keys`)
        for (const e of t.keys) r.has(e) || r.set(e, {}), (r.get(e).r = !0);
      else e.issues.push(t);
    const a = [...r].filter(([, e]) => e.l && e.r).map(([e]) => e);
    if ((a.length && i && e.issues.push({ ...i, keys: a }), Mn(e))) return e;
    const o = Ui(t.value, n.value);
    if (!o.valid)
      throw Error(
        `Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`,
      );
    return (e.value = o.data), e;
  }
  var Gi = A(`$ZodRecord`, (e, t) => {
      N.init(e, t),
        (e._zod.parse = (n, r) => {
          const i = n.value;
          if (!vn(i))
            return (
              n.issues.push({
                expected: `record`,
                code: `invalid_type`,
                input: i,
                inst: e,
              }),
              n
            );
          const a = [],
            o = t.keyType._zod.values;
          if (o) {
            n.value = {};
            const s = new Set();
            for (const c of o)
              if (
                typeof c == `string` ||
                typeof c == `number` ||
                typeof c == `symbol`
              ) {
                s.add(typeof c == `number` ? c.toString() : c);
                const o = t.keyType._zod.run({ value: c, issues: [] }, r);
                if (o instanceof Promise)
                  throw Error(
                    `Async schemas not supported in object keys currently`,
                  );
                if (o.issues.length) {
                  n.issues.push({
                    code: `invalid_key`,
                    origin: `record`,
                    issues: o.issues.map((e) => In(e, r, nn())),
                    input: c,
                    path: [c],
                    inst: e,
                  });
                  continue;
                }
                const l = o.value,
                  u = t.valueType._zod.run({ value: i[c], issues: [] }, r);
                u instanceof Promise
                  ? a.push(
                      u.then((e) => {
                        e.issues.length && n.issues.push(...Pn(c, e.issues)),
                          (n.value[l] = e.value);
                      }),
                    )
                  : (u.issues.length && n.issues.push(...Pn(c, u.issues)),
                    (n.value[l] = u.value));
              }
            let c;
            for (const e in i) s.has(e) || ((c ??= []), c.push(e));
            c &&
              c.length > 0 &&
              n.issues.push({
                code: `unrecognized_keys`,
                input: i,
                inst: e,
                keys: c,
              });
          } else {
            n.value = {};
            for (const o of Reflect.ownKeys(i)) {
              if (
                o === `__proto__` ||
                !Object.prototype.propertyIsEnumerable.call(i, o)
              )
                continue;
              let s = t.keyType._zod.run({ value: o, issues: [] }, r);
              if (s instanceof Promise)
                throw Error(
                  `Async schemas not supported in object keys currently`,
                );
              if (typeof o == `string` && jr.test(o) && s.issues.length) {
                const e = t.keyType._zod.run(
                  { value: Number(o), issues: [] },
                  r,
                );
                if (e instanceof Promise)
                  throw Error(
                    `Async schemas not supported in object keys currently`,
                  );
                e.issues.length === 0 && (s = e);
              }
              if (s.issues.length) {
                t.mode === `loose`
                  ? (n.value[o] = i[o])
                  : n.issues.push({
                      code: `invalid_key`,
                      origin: `record`,
                      issues: s.issues.map((e) => In(e, r, nn())),
                      input: o,
                      path: [o],
                      inst: e,
                    });
                continue;
              }
              const c = t.valueType._zod.run({ value: i[o], issues: [] }, r);
              c instanceof Promise
                ? a.push(
                    c.then((e) => {
                      e.issues.length && n.issues.push(...Pn(o, e.issues)),
                        (n.value[s.value] = e.value);
                    }),
                  )
                : (c.issues.length && n.issues.push(...Pn(o, c.issues)),
                  (n.value[s.value] = c.value));
            }
          }
          return a.length ? Promise.all(a).then(() => n) : n;
        });
    }),
    Ki = A(`$ZodEnum`, (e, t) => {
      N.init(e, t);
      const n = rn(t.entries),
        r = new Set(n);
      (e._zod.values = r),
        (e._zod.pattern = RegExp(
          `^(${n
            .filter((e) => bn.has(typeof e))
            .map((e) => (typeof e == `string` ? xn(e) : e.toString()))
            .join(`|`)})$`,
        )),
        (e._zod.parse = (t, i) => {
          const a = t.value;
          return (
            r.has(a) ||
              t.issues.push({
                code: `invalid_value`,
                values: n,
                input: a,
                inst: e,
              }),
            t
          );
        });
    }),
    qi = A(`$ZodLiteral`, (e, t) => {
      if ((N.init(e, t), t.values.length === 0))
        throw Error(`Cannot create literal schema with no valid values`);
      const n = new Set(t.values);
      (e._zod.values = n),
        (e._zod.pattern = RegExp(
          `^(${t.values.map((e) => (typeof e == `string` ? xn(e) : e ? xn(e.toString()) : String(e))).join(`|`)})$`,
        )),
        (e._zod.parse = (r, i) => {
          const a = r.value;
          return (
            n.has(a) ||
              r.issues.push({
                code: `invalid_value`,
                values: t.values,
                input: a,
                inst: e,
              }),
            r
          );
        });
    }),
    Ji = A(`$ZodTransform`, (e, t) => {
      N.init(e, t),
        (e._zod.optin = `optional`),
        (e._zod.parse = (n, r) => {
          if (r.direction === `backward`) throw new en(e.constructor.name);
          const i = t.transform(n.value, n);
          if (r.async)
            return (i instanceof Promise ? i : Promise.resolve(i)).then(
              (e) => ((n.value = e), (n.fallback = !0), n),
            );
          if (i instanceof Promise) throw new $t();
          return (n.value = i), (n.fallback = !0), n;
        });
    });
  function Yi(e, t) {
    return t === void 0 && (e.issues.length || e.fallback)
      ? { issues: [], value: void 0 }
      : e;
  }
  var Xi = A(`$ZodOptional`, (e, t) => {
      N.init(e, t),
        (e._zod.optin = `optional`),
        (e._zod.optout = `optional`),
        j(e._zod, `values`, () =>
          t.innerType._zod.values
            ? new Set([...t.innerType._zod.values, void 0])
            : void 0,
        ),
        j(e._zod, `pattern`, () => {
          const e = t.innerType._zod.pattern;
          return e ? RegExp(`^(${cn(e.source)})?$`) : void 0;
        }),
        (e._zod.parse = (e, n) => {
          if (t.innerType._zod.optin === `optional`) {
            const r = e.value,
              i = t.innerType._zod.run(e, n);
            return i instanceof Promise ? i.then((e) => Yi(e, r)) : Yi(i, r);
          }
          return e.value === void 0 ? e : t.innerType._zod.run(e, n);
        });
    }),
    Zi = A(`$ZodExactOptional`, (e, t) => {
      Xi.init(e, t),
        j(e._zod, `values`, () => t.innerType._zod.values),
        j(e._zod, `pattern`, () => t.innerType._zod.pattern),
        (e._zod.parse = (e, n) => t.innerType._zod.run(e, n));
    }),
    Qi = A(`$ZodNullable`, (e, t) => {
      N.init(e, t),
        j(e._zod, `optin`, () => t.innerType._zod.optin),
        j(e._zod, `optout`, () => t.innerType._zod.optout),
        j(e._zod, `pattern`, () => {
          const e = t.innerType._zod.pattern;
          return e ? RegExp(`^(${cn(e.source)}|null)$`) : void 0;
        }),
        j(e._zod, `values`, () =>
          t.innerType._zod.values
            ? new Set([...t.innerType._zod.values, null])
            : void 0,
        ),
        (e._zod.parse = (e, n) =>
          e.value === null ? e : t.innerType._zod.run(e, n));
    }),
    $i = A(`$ZodDefault`, (e, t) => {
      N.init(e, t),
        (e._zod.optin = `optional`),
        j(e._zod, `values`, () => t.innerType._zod.values),
        (e._zod.parse = (e, n) => {
          if (n.direction === `backward`) return t.innerType._zod.run(e, n);
          if (e.value === void 0) return (e.value = t.defaultValue), e;
          const r = t.innerType._zod.run(e, n);
          return r instanceof Promise ? r.then((e) => ea(e, t)) : ea(r, t);
        });
    });
  function ea(e, t) {
    return e.value === void 0 && (e.value = t.defaultValue), e;
  }
  var ta = A(`$ZodPrefault`, (e, t) => {
      N.init(e, t),
        (e._zod.optin = `optional`),
        j(e._zod, `values`, () => t.innerType._zod.values),
        (e._zod.parse = (e, n) => (
          n.direction === `backward` ||
            (e.value === void 0 && (e.value = t.defaultValue)),
          t.innerType._zod.run(e, n)
        ));
    }),
    na = A(`$ZodNonOptional`, (e, t) => {
      N.init(e, t),
        j(e._zod, `values`, () => {
          const e = t.innerType._zod.values;
          return e ? new Set([...e].filter((e) => e !== void 0)) : void 0;
        }),
        (e._zod.parse = (n, r) => {
          const i = t.innerType._zod.run(n, r);
          return i instanceof Promise ? i.then((t) => ra(t, e)) : ra(i, e);
        });
    });
  function ra(e, t) {
    return (
      !e.issues.length &&
        e.value === void 0 &&
        e.issues.push({
          code: `invalid_type`,
          expected: `nonoptional`,
          input: e.value,
          inst: t,
        }),
      e
    );
  }
  var ia = A(`$ZodCatch`, (e, t) => {
      N.init(e, t),
        (e._zod.optin = `optional`),
        j(e._zod, `optout`, () => t.innerType._zod.optout),
        j(e._zod, `values`, () => t.innerType._zod.values),
        (e._zod.parse = (e, n) => {
          if (n.direction === `backward`) return t.innerType._zod.run(e, n);
          const r = t.innerType._zod.run(e, n);
          return r instanceof Promise
            ? r.then(
                (r) => (
                  (e.value = r.value),
                  r.issues.length &&
                    ((e.value = t.catchValue({
                      ...e,
                      error: { issues: r.issues.map((e) => In(e, n, nn())) },
                      input: e.value,
                    })),
                    (e.issues = []),
                    (e.fallback = !0)),
                  e
                ),
              )
            : ((e.value = r.value),
              r.issues.length &&
                ((e.value = t.catchValue({
                  ...e,
                  error: { issues: r.issues.map((e) => In(e, n, nn())) },
                  input: e.value,
                })),
                (e.issues = []),
                (e.fallback = !0)),
              e);
        });
    }),
    aa = A(`$ZodPipe`, (e, t) => {
      N.init(e, t),
        j(e._zod, `values`, () => t.in._zod.values),
        j(e._zod, `optin`, () => t.in._zod.optin),
        j(e._zod, `optout`, () => t.out._zod.optout),
        j(e._zod, `propValues`, () => t.in._zod.propValues),
        (e._zod.parse = (e, n) => {
          if (n.direction === `backward`) {
            const r = t.out._zod.run(e, n);
            return r instanceof Promise
              ? r.then((e) => oa(e, t.in, n))
              : oa(r, t.in, n);
          }
          const r = t.in._zod.run(e, n);
          return r instanceof Promise
            ? r.then((e) => oa(e, t.out, n))
            : oa(r, t.out, n);
        });
    });
  function oa(e, t, n) {
    return e.issues.length
      ? ((e.aborted = !0), e)
      : t._zod.run(
          { value: e.value, issues: e.issues, fallback: e.fallback },
          n,
        );
  }
  var sa = A(`$ZodReadonly`, (e, t) => {
    N.init(e, t),
      j(e._zod, `propValues`, () => t.innerType._zod.propValues),
      j(e._zod, `values`, () => t.innerType._zod.values),
      j(e._zod, `optin`, () => t.innerType?._zod?.optin),
      j(e._zod, `optout`, () => t.innerType?._zod?.optout),
      (e._zod.parse = (e, n) => {
        if (n.direction === `backward`) return t.innerType._zod.run(e, n);
        const r = t.innerType._zod.run(e, n);
        return r instanceof Promise ? r.then(ca) : ca(r);
      });
  });
  function ca(e) {
    return (e.value = Object.freeze(e.value)), e;
  }
  var la = A(`$ZodCustom`, (e, t) => {
    Ir.init(e, t),
      N.init(e, t),
      (e._zod.parse = (e, t) => e),
      (e._zod.check = (n) => {
        const r = n.value,
          i = t.fn(r);
        if (i instanceof Promise) return i.then((t) => ua(t, n, r, e));
        ua(i, n, r, e);
      });
  });
  function ua(e, t, n, r) {
    if (!e) {
      const e = {
        code: `custom`,
        input: n,
        inst: r,
        path: [...(r._zod.def.path ?? [])],
        continue: !r._zod.def.abort,
      };
      r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(Rn(e));
    }
  }
  var da,
    fa = class {
      constructor() {
        (this._map = new WeakMap()), (this._idmap = new Map());
      }
      add(e, ...t) {
        const n = t[0];
        return (
          this._map.set(e, n),
          n && typeof n == `object` && `id` in n && this._idmap.set(n.id, e),
          this
        );
      }
      clear() {
        return (this._map = new WeakMap()), (this._idmap = new Map()), this;
      }
      remove(e) {
        const t = this._map.get(e);
        return (
          t && typeof t == `object` && `id` in t && this._idmap.delete(t.id),
          this._map.delete(e),
          this
        );
      }
      get(e) {
        const t = e._zod.parent;
        if (t) {
          const n = { ...(this.get(t) ?? {}) };
          delete n.id;
          const r = { ...n, ...this._map.get(e) };
          return Object.keys(r).length ? r : void 0;
        }
        return this._map.get(e);
      }
      has(e) {
        return this._map.has(e);
      }
    };
  function pa() {
    return new fa();
  }
  (da = globalThis).__zod_globalRegistry ?? (da.__zod_globalRegistry = pa());
  var ma = globalThis.__zod_globalRegistry;
  function ha(e, t) {
    return new e({ type: `string`, ...M(t) });
  }
  function ga(e, t) {
    return new e({
      type: `string`,
      format: `email`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function _a(e, t) {
    return new e({
      type: `string`,
      format: `guid`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function va(e, t) {
    return new e({
      type: `string`,
      format: `uuid`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function ya(e, t) {
    return new e({
      type: `string`,
      format: `uuid`,
      check: `string_format`,
      abort: !1,
      version: `v4`,
      ...M(t),
    });
  }
  function ba(e, t) {
    return new e({
      type: `string`,
      format: `uuid`,
      check: `string_format`,
      abort: !1,
      version: `v6`,
      ...M(t),
    });
  }
  function xa(e, t) {
    return new e({
      type: `string`,
      format: `uuid`,
      check: `string_format`,
      abort: !1,
      version: `v7`,
      ...M(t),
    });
  }
  function Sa(e, t) {
    return new e({
      type: `string`,
      format: `url`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Ca(e, t) {
    return new e({
      type: `string`,
      format: `emoji`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function wa(e, t) {
    return new e({
      type: `string`,
      format: `nanoid`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Ta(e, t) {
    return new e({
      type: `string`,
      format: `cuid`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Ea(e, t) {
    return new e({
      type: `string`,
      format: `cuid2`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Da(e, t) {
    return new e({
      type: `string`,
      format: `ulid`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Oa(e, t) {
    return new e({
      type: `string`,
      format: `xid`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function ka(e, t) {
    return new e({
      type: `string`,
      format: `ksuid`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Aa(e, t) {
    return new e({
      type: `string`,
      format: `ipv4`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function ja(e, t) {
    return new e({
      type: `string`,
      format: `ipv6`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Ma(e, t) {
    return new e({
      type: `string`,
      format: `cidrv4`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Na(e, t) {
    return new e({
      type: `string`,
      format: `cidrv6`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Pa(e, t) {
    return new e({
      type: `string`,
      format: `base64`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Fa(e, t) {
    return new e({
      type: `string`,
      format: `base64url`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Ia(e, t) {
    return new e({
      type: `string`,
      format: `e164`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function La(e, t) {
    return new e({
      type: `string`,
      format: `jwt`,
      check: `string_format`,
      abort: !1,
      ...M(t),
    });
  }
  function Ra(e, t) {
    return new e({
      type: `string`,
      format: `datetime`,
      check: `string_format`,
      offset: !1,
      local: !1,
      precision: null,
      ...M(t),
    });
  }
  function za(e, t) {
    return new e({
      type: `string`,
      format: `date`,
      check: `string_format`,
      ...M(t),
    });
  }
  function Ba(e, t) {
    return new e({
      type: `string`,
      format: `time`,
      check: `string_format`,
      precision: null,
      ...M(t),
    });
  }
  function Va(e, t) {
    return new e({
      type: `string`,
      format: `duration`,
      check: `string_format`,
      ...M(t),
    });
  }
  function Ha(e, t) {
    return new e({ type: `number`, checks: [], ...M(t) });
  }
  function Ua(e, t) {
    return new e({
      type: `number`,
      check: `number_format`,
      abort: !1,
      format: `safeint`,
      ...M(t),
    });
  }
  function Wa(e, t) {
    return new e({ type: `boolean`, ...M(t) });
  }
  function Ga(e, t) {
    return new e({ type: `null`, ...M(t) });
  }
  function Ka(e) {
    return new e({ type: `unknown` });
  }
  function qa(e, t) {
    return new e({ type: `never`, ...M(t) });
  }
  function Ja(e, t) {
    return new Rr({ check: `less_than`, ...M(t), value: e, inclusive: !1 });
  }
  function Ya(e, t) {
    return new Rr({ check: `less_than`, ...M(t), value: e, inclusive: !0 });
  }
  function Xa(e, t) {
    return new zr({ check: `greater_than`, ...M(t), value: e, inclusive: !1 });
  }
  function Za(e, t) {
    return new zr({ check: `greater_than`, ...M(t), value: e, inclusive: !0 });
  }
  function Qa(e, t) {
    return new Br({ check: `multiple_of`, ...M(t), value: e });
  }
  function $a(e, t) {
    return new Hr({ check: `max_length`, ...M(t), maximum: e });
  }
  function eo(e, t) {
    return new Ur({ check: `min_length`, ...M(t), minimum: e });
  }
  function to(e, t) {
    return new Wr({ check: `length_equals`, ...M(t), length: e });
  }
  function no(e, t) {
    return new Kr({
      check: `string_format`,
      format: `regex`,
      ...M(t),
      pattern: e,
    });
  }
  function ro(e) {
    return new qr({ check: `string_format`, format: `lowercase`, ...M(e) });
  }
  function io(e) {
    return new Jr({ check: `string_format`, format: `uppercase`, ...M(e) });
  }
  function ao(e, t) {
    return new Yr({
      check: `string_format`,
      format: `includes`,
      ...M(t),
      includes: e,
    });
  }
  function oo(e, t) {
    return new Xr({
      check: `string_format`,
      format: `starts_with`,
      ...M(t),
      prefix: e,
    });
  }
  function so(e, t) {
    return new Zr({
      check: `string_format`,
      format: `ends_with`,
      ...M(t),
      suffix: e,
    });
  }
  function co(e) {
    return new Qr({ check: `overwrite`, tx: e });
  }
  function lo(e) {
    return co((t) => t.normalize(e));
  }
  function uo() {
    return co((e) => e.trim());
  }
  function fo() {
    return co((e) => e.toLowerCase());
  }
  function po() {
    return co((e) => e.toUpperCase());
  }
  function mo() {
    return co((e) => mn(e));
  }
  function ho(e, t, n) {
    return new e({ type: `array`, element: t, ...M(n) });
  }
  function go(e, t, n) {
    return new e({ type: `custom`, check: `custom`, fn: t, ...M(n) });
  }
  function L(e, t) {
    const n = R(
      (t) => (
        (t.addIssue = (e) => {
          if (typeof e == `string`) t.issues.push(Rn(e, t.value, n._zod.def));
          else {
            const r = e;
            r.fatal && (r.continue = !1),
              (r.code ??= `custom`),
              (r.input ??= t.value),
              (r.inst ??= n),
              (r.continue ??= !n._zod.def.abort),
              t.issues.push(Rn(r));
          }
        }),
        e(t.value, t)
      ),
      t,
    );
    return n;
  }
  function R(e, t) {
    const n = new Ir({ check: `custom`, ...M(t) });
    return (n._zod.check = e), n;
  }
  function _o(e) {
    let t = e?.target ?? `draft-2020-12`;
    return (
      t === `draft-4` && (t = `draft-04`),
      t === `draft-7` && (t = `draft-07`),
      {
        processors: e.processors ?? {},
        metadataRegistry: e?.metadata ?? ma,
        target: t,
        unrepresentable: e?.unrepresentable ?? `throw`,
        override: e?.override ?? (() => {}),
        io: e?.io ?? `output`,
        counter: 0,
        seen: new Map(),
        cycles: e?.cycles ?? `ref`,
        reused: e?.reused ?? `inline`,
        external: e?.external ?? void 0,
      }
    );
  }
  function vo(e, t, n = { path: [], schemaPath: [] }) {
    var r;
    const i = e._zod.def,
      a = t.seen.get(e);
    if (a)
      return (
        a.count++, n.schemaPath.includes(e) && (a.cycle = n.path), a.schema
      );
    const o = { schema: {}, count: 1, cycle: void 0, path: n.path };
    t.seen.set(e, o);
    const s = e._zod.toJSONSchema?.();
    if (s) o.schema = s;
    else {
      const r = { ...n, schemaPath: [...n.schemaPath, e], path: n.path };
      if (e._zod.processJSONSchema) e._zod.processJSONSchema(t, o.schema, r);
      else {
        const n = o.schema,
          a = t.processors[i.type];
        if (!a)
          throw Error(
            `[toJSONSchema]: Non-representable type encountered: ${i.type}`,
          );
        a(e, t, n, r);
      }
      const a = e._zod.parent;
      a && ((o.ref ||= a), vo(a, t, r), (t.seen.get(a).isParent = !0));
    }
    const c = t.metadataRegistry.get(e);
    return (
      c && Object.assign(o.schema, c),
      t.io === `input` &&
        xo(e) &&
        (delete o.schema.examples, delete o.schema.default),
      t.io === `input` &&
        `_prefault` in o.schema &&
        ((r = o.schema).default ?? (r.default = o.schema._prefault)),
      delete o.schema._prefault,
      t.seen.get(e).schema
    );
  }
  function yo(e, t) {
    const n = e.seen.get(t);
    if (!n) throw Error(`Unprocessed schema. This is a bug in Zod.`);
    const r = new Map();
    for (const t of e.seen.entries()) {
      const n = e.metadataRegistry.get(t[0])?.id;
      if (n) {
        const e = r.get(n);
        if (e && e !== t[0])
          throw Error(
            `Duplicate schema id "${n}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`,
          );
        r.set(n, t[0]);
      }
    }
    const i = (t) => {
        const r = e.target === `draft-2020-12` ? `$defs` : `definitions`;
        if (e.external) {
          const n = e.external.registry.get(t[0])?.id,
            i = e.external.uri ?? ((e) => e);
          if (n) return { ref: i(n) };
          const a = t[1].defId ?? t[1].schema.id ?? `schema${e.counter++}`;
          return (
            (t[1].defId = a), { defId: a, ref: `${i(`__shared`)}#/${r}/${a}` }
          );
        }
        if (t[1] === n) return { ref: `#` };
        const i = `#/${r}/`,
          a = t[1].schema.id ?? `__schema${e.counter++}`;
        return { defId: a, ref: i + a };
      },
      a = (e) => {
        if (e[1].schema.$ref) return;
        const t = e[1],
          { ref: n, defId: r } = i(e);
        (t.def = { ...t.schema }), r && (t.defId = r);
        const a = t.schema;
        for (const e in a) delete a[e];
        a.$ref = n;
      };
    if (e.cycles === `throw`)
      for (const t of e.seen.entries()) {
        const e = t[1];
        if (e.cycle)
          throw Error(`Cycle detected: #/${e.cycle?.join(`/`)}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
      }
    for (const n of e.seen.entries()) {
      const r = n[1];
      if (t === n[0]) {
        a(n);
        continue;
      }
      if (e.external) {
        const r = e.external.registry.get(n[0])?.id;
        if (t !== n[0] && r) {
          a(n);
          continue;
        }
      }
      if (e.metadataRegistry.get(n[0])?.id) {
        a(n);
        continue;
      }
      if (r.cycle) {
        a(n);
        continue;
      }
      if (r.count > 1 && e.reused === `ref`) {
        a(n);
      }
    }
  }
  function bo(e, t) {
    const n = e.seen.get(t);
    if (!n) throw Error(`Unprocessed schema. This is a bug in Zod.`);
    const r = (t) => {
      const n = e.seen.get(t);
      if (n.ref === null) return;
      const i = n.def ?? n.schema,
        a = { ...i },
        o = n.ref;
      if (((n.ref = null), o)) {
        r(o);
        const n = e.seen.get(o),
          s = n.schema;
        if (
          (s.$ref &&
          (e.target === `draft-07` ||
            e.target === `draft-04` ||
            e.target === `openapi-3.0`)
            ? ((i.allOf = i.allOf ?? []), i.allOf.push(s))
            : Object.assign(i, s),
          Object.assign(i, a),
          t._zod.parent === o)
        )
          for (const e in i)
            e === `$ref` || e === `allOf` || e in a || delete i[e];
        if (s.$ref && n.def)
          for (const e in i)
            e === `$ref` ||
              e === `allOf` ||
              (e in n.def &&
                JSON.stringify(i[e]) === JSON.stringify(n.def[e]) &&
                delete i[e]);
      }
      const s = t._zod.parent;
      if (s && s !== o) {
        r(s);
        const t = e.seen.get(s);
        if (t?.schema.$ref && ((i.$ref = t.schema.$ref), t.def))
          for (const e in i)
            e === `$ref` ||
              e === `allOf` ||
              (e in t.def &&
                JSON.stringify(i[e]) === JSON.stringify(t.def[e]) &&
                delete i[e]);
      }
      e.override({ zodSchema: t, jsonSchema: i, path: n.path ?? [] });
    };
    for (const t of [...e.seen.entries()].reverse()) r(t[0]);
    const i = {};
    if (
      (e.target === `draft-2020-12`
        ? (i.$schema = `https://json-schema.org/draft/2020-12/schema`)
        : e.target === `draft-07`
          ? (i.$schema = `http://json-schema.org/draft-07/schema#`)
          : e.target === `draft-04`
            ? (i.$schema = `http://json-schema.org/draft-04/schema#`)
            : e.target,
      e.external?.uri)
    ) {
      const n = e.external.registry.get(t)?.id;
      if (!n) throw Error("Schema is missing an `id` property");
      i.$id = e.external.uri(n);
    }
    Object.assign(i, n.def ?? n.schema);
    const a = e.metadataRegistry.get(t)?.id;
    a !== void 0 && i.id === a && delete i.id;
    const o = e.external?.defs ?? {};
    for (const t of e.seen.entries()) {
      const e = t[1];
      e.def &&
        e.defId &&
        (e.def.id === e.defId && delete e.def.id, (o[e.defId] = e.def));
    }
    e.external ||
      (Object.keys(o).length > 0 &&
        (e.target === `draft-2020-12` ? (i.$defs = o) : (i.definitions = o)));
    try {
      const n = JSON.parse(JSON.stringify(i));
      return (
        Object.defineProperty(n, "~standard", {
          value: {
            ...t[`~standard`],
            jsonSchema: {
              input: Co(t, `input`, e.processors),
              output: Co(t, `output`, e.processors),
            },
          },
          enumerable: !1,
          writable: !1,
        }),
        n
      );
    } catch {
      throw Error(`Error converting schema to JSON.`);
    }
  }
  function xo(e, t) {
    const n = t ?? { seen: new Set() };
    if (n.seen.has(e)) return !1;
    n.seen.add(e);
    const r = e._zod.def;
    if (r.type === `transform`) return !0;
    if (r.type === `array`) return xo(r.element, n);
    if (r.type === `set`) return xo(r.valueType, n);
    if (r.type === `lazy`) return xo(r.getter(), n);
    if (
      r.type === `promise` ||
      r.type === `optional` ||
      r.type === `nonoptional` ||
      r.type === `nullable` ||
      r.type === `readonly` ||
      r.type === "default" ||
      r.type === `prefault`
    )
      return xo(r.innerType, n);
    if (r.type === `intersection`) return xo(r.left, n) || xo(r.right, n);
    if (r.type === `record` || r.type === `map`)
      return xo(r.keyType, n) || xo(r.valueType, n);
    if (r.type === `pipe`)
      return e._zod.traits.has(`$ZodCodec`) ? !0 : xo(r.in, n) || xo(r.out, n);
    if (r.type === `object`) {
      for (const e in r.shape) if (xo(r.shape[e], n)) return !0;
      return !1;
    }
    if (r.type === `union`) {
      for (const e of r.options) if (xo(e, n)) return !0;
      return !1;
    }
    if (r.type === `tuple`) {
      for (const e of r.items) if (xo(e, n)) return !0;
      return !!(r.rest && xo(r.rest, n));
    }
    return !1;
  }
  var So =
      (e, t = {}) =>
      (n) => {
        const r = _o({ ...n, processors: t });
        return vo(e, r), yo(r, e), bo(r, e);
      },
    Co =
      (e, t, n = {}) =>
      (r) => {
        const { libraryOptions: i, target: a } = r ?? {},
          o = _o({ ...(i ?? {}), target: a, io: t, processors: n });
        return vo(e, o), yo(o, e), bo(o, e);
      },
    wo = {
      guid: `uuid`,
      url: `uri`,
      datetime: `date-time`,
      json_string: `json-string`,
      regex: ``,
    },
    To = (e, t, n, r) => {
      const i = n;
      i.type = `string`;
      const {
        minimum: a,
        maximum: o,
        format: s,
        patterns: c,
        contentEncoding: l,
      } = e._zod.bag;
      if (
        (typeof a == `number` && (i.minLength = a),
        typeof o == `number` && (i.maxLength = o),
        s &&
          ((i.format = wo[s] ?? s),
          i.format === `` && delete i.format,
          s === `time` && delete i.format),
        l && (i.contentEncoding = l),
        c && c.size > 0)
      ) {
        const e = [...c];
        e.length === 1
          ? (i.pattern = e[0].source)
          : e.length > 1 &&
            (i.allOf = [
              ...e.map((e) => ({
                ...(t.target === `draft-07` ||
                t.target === `draft-04` ||
                t.target === `openapi-3.0`
                  ? { type: `string` }
                  : {}),
                pattern: e.source,
              })),
            ]);
      }
    },
    Eo = (e, t, n, r) => {
      const i = n,
        {
          minimum: a,
          maximum: o,
          format: s,
          multipleOf: c,
          exclusiveMaximum: l,
          exclusiveMinimum: u,
        } = e._zod.bag;
      typeof s == `string` && s.includes(`int`)
        ? (i.type = `integer`)
        : (i.type = `number`);
      const d = typeof u == `number` && u >= (a ?? -1 / 0),
        f = typeof l == `number` && l <= (o ?? 1 / 0),
        p = t.target === `draft-04` || t.target === `openapi-3.0`;
      d
        ? p
          ? ((i.minimum = u), (i.exclusiveMinimum = !0))
          : (i.exclusiveMinimum = u)
        : typeof a == `number` && (i.minimum = a),
        f
          ? p
            ? ((i.maximum = l), (i.exclusiveMaximum = !0))
            : (i.exclusiveMaximum = l)
          : typeof o == `number` && (i.maximum = o),
        typeof c == `number` && (i.multipleOf = c);
    },
    Do = (e, t, n, r) => {
      n.type = `boolean`;
    },
    Oo = (e, t, n, r) => {
      t.target === `openapi-3.0`
        ? ((n.type = `string`), (n.nullable = !0), (n.enum = [null]))
        : (n.type = `null`);
    },
    ko = (e, t, n, r) => {
      n.not = {};
    },
    Ao = (e, t, n, r) => {
      const i = e._zod.def,
        a = rn(i.entries);
      a.every((e) => typeof e == `number`) && (n.type = `number`),
        a.every((e) => typeof e == `string`) && (n.type = `string`),
        (n.enum = a);
    },
    jo = (e, t, n, r) => {
      const i = e._zod.def,
        a = [];
      for (const e of i.values)
        if (e === void 0) {
          if (t.unrepresentable === `throw`)
            throw Error(
              "Literal `undefined` cannot be represented in JSON Schema",
            );
        } else if (typeof e == `bigint`) {
          if (t.unrepresentable === `throw`)
            throw Error(`BigInt literals cannot be represented in JSON Schema`);
          a.push(Number(e));
        } else a.push(e);
      if (a.length !== 0)
        if (a.length === 1) {
          const e = a[0];
          (n.type = e === null ? `null` : typeof e),
            t.target === `draft-04` || t.target === `openapi-3.0`
              ? (n.enum = [e])
              : (n.const = e);
        } else
          a.every((e) => typeof e == `number`) && (n.type = `number`),
            a.every((e) => typeof e == `string`) && (n.type = `string`),
            a.every((e) => typeof e == `boolean`) && (n.type = `boolean`),
            a.every((e) => e === null) && (n.type = `null`),
            (n.enum = a);
    },
    Mo = (e, t, n, r) => {
      if (t.unrepresentable === `throw`)
        throw Error(`Custom types cannot be represented in JSON Schema`);
    },
    No = (e, t, n, r) => {
      if (t.unrepresentable === `throw`)
        throw Error(`Transforms cannot be represented in JSON Schema`);
    },
    Po = (e, t, n, r) => {
      const i = n,
        a = e._zod.def,
        { minimum: o, maximum: s } = e._zod.bag;
      typeof o == `number` && (i.minItems = o),
        typeof s == `number` && (i.maxItems = s),
        (i.type = `array`),
        (i.items = vo(a.element, t, { ...r, path: [...r.path, `items`] }));
    },
    Fo = (e, t, n, r) => {
      const i = n,
        a = e._zod.def;
      (i.type = `object`), (i.properties = {});
      const o = a.shape;
      for (const e in o)
        i.properties[e] = vo(o[e], t, {
          ...r,
          path: [...r.path, `properties`, e],
        });
      const s = new Set(Object.keys(o)),
        c = new Set(
          [...s].filter((e) => {
            const n = a.shape[e]._zod;
            return t.io === `input` ? n.optin === void 0 : n.optout === void 0;
          }),
        );
      c.size > 0 && (i.required = Array.from(c)),
        a.catchall?._zod.def.type === `never`
          ? (i.additionalProperties = !1)
          : a.catchall
            ? a.catchall &&
              (i.additionalProperties = vo(a.catchall, t, {
                ...r,
                path: [...r.path, `additionalProperties`],
              }))
            : t.io === `output` && (i.additionalProperties = !1);
    },
    Io = (e, t, n, r) => {
      const i = e._zod.def,
        a = i.inclusive === !1,
        o = i.options.map((e, n) =>
          vo(e, t, { ...r, path: [...r.path, a ? `oneOf` : `anyOf`, n] }),
        );
      a ? (n.oneOf = o) : (n.anyOf = o);
    },
    Lo = (e, t, n, r) => {
      const i = e._zod.def,
        a = vo(i.left, t, { ...r, path: [...r.path, `allOf`, 0] }),
        o = vo(i.right, t, { ...r, path: [...r.path, `allOf`, 1] }),
        s = (e) => `allOf` in e && Object.keys(e).length === 1;
      n.allOf = [...(s(a) ? a.allOf : [a]), ...(s(o) ? o.allOf : [o])];
    },
    Ro = (e, t, n, r) => {
      const i = n,
        a = e._zod.def;
      i.type = `object`;
      const o = a.keyType,
        s = o._zod.bag?.patterns;
      if (a.mode === `loose` && s && s.size > 0) {
        const e = vo(a.valueType, t, {
          ...r,
          path: [...r.path, `patternProperties`, `*`],
        });
        i.patternProperties = {};
        for (const t of s) i.patternProperties[t.source] = e;
      } else
        (t.target === `draft-07` || t.target === `draft-2020-12`) &&
          (i.propertyNames = vo(a.keyType, t, {
            ...r,
            path: [...r.path, `propertyNames`],
          })),
          (i.additionalProperties = vo(a.valueType, t, {
            ...r,
            path: [...r.path, `additionalProperties`],
          }));
      const c = o._zod.values;
      if (c) {
        const e = [...c].filter(
          (e) => typeof e == `string` || typeof e == `number`,
        );
        e.length > 0 && (i.required = e);
      }
    },
    zo = (e, t, n, r) => {
      const i = e._zod.def,
        a = vo(i.innerType, t, r),
        o = t.seen.get(e);
      t.target === `openapi-3.0`
        ? ((o.ref = i.innerType), (n.nullable = !0))
        : (n.anyOf = [a, { type: `null` }]);
    },
    Bo = (e, t, n, r) => {
      const i = e._zod.def;
      vo(i.innerType, t, r);
      const a = t.seen.get(e);
      a.ref = i.innerType;
    },
    Vo = (e, t, n, r) => {
      const i = e._zod.def;
      vo(i.innerType, t, r);
      const a = t.seen.get(e);
      (a.ref = i.innerType),
        (n.default = JSON.parse(JSON.stringify(i.defaultValue)));
    },
    Ho = (e, t, n, r) => {
      const i = e._zod.def;
      vo(i.innerType, t, r);
      const a = t.seen.get(e);
      (a.ref = i.innerType),
        t.io === `input` &&
          (n._prefault = JSON.parse(JSON.stringify(i.defaultValue)));
    },
    Uo = (e, t, n, r) => {
      const i = e._zod.def;
      vo(i.innerType, t, r);
      const a = t.seen.get(e);
      a.ref = i.innerType;
      let o;
      try {
        o = i.catchValue(void 0);
      } catch {
        throw Error(`Dynamic catch values are not supported in JSON Schema`);
      }
      n.default = o;
    },
    Wo = (e, t, n, r) => {
      const i = e._zod.def,
        a = i.in._zod.traits.has(`$ZodTransform`),
        o = t.io === `input` ? (a ? i.out : i.in) : i.out;
      vo(o, t, r);
      const s = t.seen.get(e);
      s.ref = o;
    },
    Go = (e, t, n, r) => {
      const i = e._zod.def;
      vo(i.innerType, t, r);
      const a = t.seen.get(e);
      (a.ref = i.innerType), (n.readOnly = !0);
    },
    Ko = (e, t, n, r) => {
      const i = e._zod.def;
      vo(i.innerType, t, r);
      const a = t.seen.get(e);
      a.ref = i.innerType;
    },
    qo = A(`ZodISODateTime`, (e, t) => {
      pi.init(e, t), ys.init(e, t);
    });
  function Jo(e) {
    return Ra(qo, e);
  }
  var Yo = A(`ZodISODate`, (e, t) => {
    mi.init(e, t), ys.init(e, t);
  });
  function Xo(e) {
    return za(Yo, e);
  }
  var Zo = A(`ZodISOTime`, (e, t) => {
    hi.init(e, t), ys.init(e, t);
  });
  function Qo(e) {
    return Ba(Zo, e);
  }
  var $o = A(`ZodISODuration`, (e, t) => {
    gi.init(e, t), ys.init(e, t);
  });
  function es(e) {
    return Va($o, e);
  }
  var ts = A(
      `ZodError`,
      (e, t) => {
        Bn.init(e, t),
          (e.name = `ZodError`),
          Object.defineProperties(e, {
            format: { value: (t) => Un(e, t) },
            flatten: { value: (t) => Hn(e, t) },
            addIssue: {
              value: (t) => {
                e.issues.push(t), (e.message = JSON.stringify(e.issues, an, 2));
              },
            },
            addIssues: {
              value: (t) => {
                e.issues.push(...t),
                  (e.message = JSON.stringify(e.issues, an, 2));
              },
            },
            isEmpty: {
              get() {
                return e.issues.length === 0;
              },
            },
          });
      },
      { Parent: Error },
    ),
    ns = Wn(ts),
    rs = Gn(ts),
    is = Kn(ts),
    as = Jn(ts),
    os = Xn(ts),
    ss = Zn(ts),
    cs = Qn(ts),
    ls = $n(ts),
    us = er(ts),
    ds = tr(ts),
    fs = nr(ts),
    ps = rr(ts),
    ms = new WeakMap();
  function hs(e, t, n) {
    let r = Object.getPrototypeOf(e),
      i = ms.get(r);
    if ((i || ((i = new Set()), ms.set(r, i)), !i.has(t))) {
      i.add(t);
      for (const e in n) {
        const t = n[e];
        Object.defineProperty(r, e, {
          configurable: !0,
          enumerable: !1,
          get() {
            const n = t.bind(this);
            return (
              Object.defineProperty(this, e, {
                configurable: !0,
                writable: !0,
                enumerable: !0,
                value: n,
              }),
              n
            );
          },
          set(t) {
            Object.defineProperty(this, e, {
              configurable: !0,
              writable: !0,
              enumerable: !0,
              value: t,
            });
          },
        });
      }
    }
  }
  var gs = A(
      `ZodType`,
      (e, t) => (
        N.init(e, t),
        Object.assign(e[`~standard`], {
          jsonSchema: { input: Co(e, `input`), output: Co(e, `output`) },
        }),
        (e.toJSONSchema = So(e, {})),
        (e.def = t),
        (e.type = t.type),
        Object.defineProperty(e, "_def", { value: t }),
        (e.parse = (t, n) => ns(e, t, n, { callee: e.parse })),
        (e.safeParse = (t, n) => is(e, t, n)),
        (e.parseAsync = async (t, n) => rs(e, t, n, { callee: e.parseAsync })),
        (e.safeParseAsync = async (t, n) => as(e, t, n)),
        (e.spa = e.safeParseAsync),
        (e.encode = (t, n) => os(e, t, n)),
        (e.decode = (t, n) => ss(e, t, n)),
        (e.encodeAsync = async (t, n) => cs(e, t, n)),
        (e.decodeAsync = async (t, n) => ls(e, t, n)),
        (e.safeEncode = (t, n) => us(e, t, n)),
        (e.safeDecode = (t, n) => ds(e, t, n)),
        (e.safeEncodeAsync = async (t, n) => fs(e, t, n)),
        (e.safeDecodeAsync = async (t, n) => ps(e, t, n)),
        hs(e, `ZodType`, {
          check(...e) {
            const t = this.def;
            return this.clone(
              fn(t, {
                checks: [
                  ...(t.checks ?? []),
                  ...e.map((e) =>
                    typeof e == `function`
                      ? {
                          _zod: {
                            check: e,
                            def: { check: `custom` },
                            onattach: [],
                          },
                        }
                      : e,
                  ),
                ],
              }),
              { parent: !0 },
            );
          },
          with(...e) {
            return this.check(...e);
          },
          clone(e, t) {
            return Sn(this, e, t);
          },
          brand() {
            return this;
          },
          register(e, t) {
            return e.add(this, t), this;
          },
          refine(e, t) {
            return this.check(Mc(e, t));
          },
          superRefine(e, t) {
            return this.check(Nc(e, t));
          },
          overwrite(e) {
            return this.check(co(e));
          },
          optional() {
            return mc(this);
          },
          exactOptional() {
            return gc(this);
          },
          nullable() {
            return vc(this);
          },
          nullish() {
            return mc(vc(this));
          },
          nonoptional(e) {
            return wc(this, e);
          },
          array() {
            return Zs(this);
          },
          or(e) {
            return tc([this, e]);
          },
          and(e) {
            return ac(this, e);
          },
          transform(e) {
            return Oc(this, fc(e));
          },
          default(e) {
            return bc(this, e);
          },
          prefault(e) {
            return Sc(this, e);
          },
          catch(e) {
            return Ec(this, e);
          },
          pipe(e) {
            return Oc(this, e);
          },
          readonly() {
            return Ac(this);
          },
          describe(e) {
            const t = this.clone();
            return ma.add(t, { description: e }), t;
          },
          meta(...e) {
            if (e.length === 0) return ma.get(this);
            const t = this.clone();
            return ma.add(t, e[0]), t;
          },
          isOptional() {
            return this.safeParse(void 0).success;
          },
          isNullable() {
            return this.safeParse(null).success;
          },
          apply(e) {
            return e(this);
          },
        }),
        Object.defineProperty(e, "description", {
          get() {
            return ma.get(e)?.description;
          },
          configurable: !0,
        }),
        e
      ),
    ),
    _s = A(`_ZodString`, (e, t) => {
      ti.init(e, t),
        gs.init(e, t),
        (e._zod.processJSONSchema = (t, n, r) => To(e, t, n, r));
      const n = e._zod.bag;
      (e.format = n.format ?? null),
        (e.minLength = n.minimum ?? null),
        (e.maxLength = n.maximum ?? null),
        hs(e, `_ZodString`, {
          regex(...e) {
            return this.check(no(...e));
          },
          includes(...e) {
            return this.check(ao(...e));
          },
          startsWith(...e) {
            return this.check(oo(...e));
          },
          endsWith(...e) {
            return this.check(so(...e));
          },
          min(...e) {
            return this.check(eo(...e));
          },
          max(...e) {
            return this.check($a(...e));
          },
          length(...e) {
            return this.check(to(...e));
          },
          nonempty(...e) {
            return this.check(eo(1, ...e));
          },
          lowercase(e) {
            return this.check(ro(e));
          },
          uppercase(e) {
            return this.check(io(e));
          },
          trim() {
            return this.check(uo());
          },
          normalize(...e) {
            return this.check(lo(...e));
          },
          toLowerCase() {
            return this.check(fo());
          },
          toUpperCase() {
            return this.check(po());
          },
          slugify() {
            return this.check(mo());
          },
        });
    }),
    vs = A(`ZodString`, (e, t) => {
      ti.init(e, t),
        _s.init(e, t),
        (e.email = (t) => e.check(ga(bs, t))),
        (e.url = (t) => e.check(Sa(Cs, t))),
        (e.jwt = (t) => e.check(La(Rs, t))),
        (e.emoji = (t) => e.check(Ca(ws, t))),
        (e.guid = (t) => e.check(_a(xs, t))),
        (e.uuid = (t) => e.check(va(Ss, t))),
        (e.uuidv4 = (t) => e.check(ya(Ss, t))),
        (e.uuidv6 = (t) => e.check(ba(Ss, t))),
        (e.uuidv7 = (t) => e.check(xa(Ss, t))),
        (e.nanoid = (t) => e.check(wa(Ts, t))),
        (e.guid = (t) => e.check(_a(xs, t))),
        (e.cuid = (t) => e.check(Ta(Es, t))),
        (e.cuid2 = (t) => e.check(Ea(Ds, t))),
        (e.ulid = (t) => e.check(Da(Os, t))),
        (e.base64 = (t) => e.check(Pa(Fs, t))),
        (e.base64url = (t) => e.check(Fa(Is, t))),
        (e.xid = (t) => e.check(Oa(ks, t))),
        (e.ksuid = (t) => e.check(ka(As, t))),
        (e.ipv4 = (t) => e.check(Aa(js, t))),
        (e.ipv6 = (t) => e.check(ja(Ms, t))),
        (e.cidrv4 = (t) => e.check(Ma(Ns, t))),
        (e.cidrv6 = (t) => e.check(Na(Ps, t))),
        (e.e164 = (t) => e.check(Ia(Ls, t))),
        (e.datetime = (t) => e.check(Jo(t))),
        (e.date = (t) => e.check(Xo(t))),
        (e.time = (t) => e.check(Qo(t))),
        (e.duration = (t) => e.check(es(t)));
    });
  function z(e) {
    return ha(vs, e);
  }
  var ys = A(`ZodStringFormat`, (e, t) => {
      P.init(e, t), _s.init(e, t);
    }),
    bs = A(`ZodEmail`, (e, t) => {
      ii.init(e, t), ys.init(e, t);
    }),
    xs = A(`ZodGUID`, (e, t) => {
      ni.init(e, t), ys.init(e, t);
    }),
    Ss = A(`ZodUUID`, (e, t) => {
      ri.init(e, t), ys.init(e, t);
    }),
    Cs = A(`ZodURL`, (e, t) => {
      ai.init(e, t), ys.init(e, t);
    }),
    ws = A(`ZodEmoji`, (e, t) => {
      oi.init(e, t), ys.init(e, t);
    }),
    Ts = A(`ZodNanoID`, (e, t) => {
      si.init(e, t), ys.init(e, t);
    }),
    Es = A(`ZodCUID`, (e, t) => {
      ci.init(e, t), ys.init(e, t);
    }),
    Ds = A(`ZodCUID2`, (e, t) => {
      li.init(e, t), ys.init(e, t);
    }),
    Os = A(`ZodULID`, (e, t) => {
      ui.init(e, t), ys.init(e, t);
    }),
    ks = A(`ZodXID`, (e, t) => {
      di.init(e, t), ys.init(e, t);
    }),
    As = A(`ZodKSUID`, (e, t) => {
      fi.init(e, t), ys.init(e, t);
    }),
    js = A(`ZodIPv4`, (e, t) => {
      _i.init(e, t), ys.init(e, t);
    }),
    Ms = A(`ZodIPv6`, (e, t) => {
      vi.init(e, t), ys.init(e, t);
    }),
    Ns = A(`ZodCIDRv4`, (e, t) => {
      yi.init(e, t), ys.init(e, t);
    }),
    Ps = A(`ZodCIDRv6`, (e, t) => {
      bi.init(e, t), ys.init(e, t);
    }),
    Fs = A(`ZodBase64`, (e, t) => {
      Si.init(e, t), ys.init(e, t);
    }),
    Is = A(`ZodBase64URL`, (e, t) => {
      wi.init(e, t), ys.init(e, t);
    }),
    Ls = A(`ZodE164`, (e, t) => {
      Ti.init(e, t), ys.init(e, t);
    }),
    Rs = A(`ZodJWT`, (e, t) => {
      Di.init(e, t), ys.init(e, t);
    }),
    zs = A(`ZodNumber`, (e, t) => {
      Oi.init(e, t),
        gs.init(e, t),
        (e._zod.processJSONSchema = (t, n, r) => Eo(e, t, n, r)),
        hs(e, `ZodNumber`, {
          gt(e, t) {
            return this.check(Xa(e, t));
          },
          gte(e, t) {
            return this.check(Za(e, t));
          },
          min(e, t) {
            return this.check(Za(e, t));
          },
          lt(e, t) {
            return this.check(Ja(e, t));
          },
          lte(e, t) {
            return this.check(Ya(e, t));
          },
          max(e, t) {
            return this.check(Ya(e, t));
          },
          int(e) {
            return this.check(Vs(e));
          },
          safe(e) {
            return this.check(Vs(e));
          },
          positive(e) {
            return this.check(Xa(0, e));
          },
          nonnegative(e) {
            return this.check(Za(0, e));
          },
          negative(e) {
            return this.check(Ja(0, e));
          },
          nonpositive(e) {
            return this.check(Ya(0, e));
          },
          multipleOf(e, t) {
            return this.check(Qa(e, t));
          },
          step(e, t) {
            return this.check(Qa(e, t));
          },
          finite() {
            return this;
          },
        });
      const n = e._zod.bag;
      (e.minValue =
        Math.max(n.minimum ?? -1 / 0, n.exclusiveMinimum ?? -1 / 0) ?? null),
        (e.maxValue =
          Math.min(n.maximum ?? 1 / 0, n.exclusiveMaximum ?? 1 / 0) ?? null),
        (e.isInt =
          (n.format ?? ``).includes(`int`) ||
          Number.isSafeInteger(n.multipleOf ?? 0.5)),
        (e.isFinite = !0),
        (e.format = n.format ?? null);
    });
  function B(e) {
    return Ha(zs, e);
  }
  var Bs = A(`ZodNumberFormat`, (e, t) => {
    ki.init(e, t), zs.init(e, t);
  });
  function Vs(e) {
    return Ua(Bs, e);
  }
  var Hs = A(`ZodBoolean`, (e, t) => {
    Ai.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Do(e, t, n, r));
  });
  function Us(e) {
    return Wa(Hs, e);
  }
  var Ws = A(`ZodNull`, (e, t) => {
    ji.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Oo(e, t, n, r));
  });
  function Gs(e) {
    return Ga(Ws, e);
  }
  var Ks = A(`ZodUnknown`, (e, t) => {
    Mi.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (e, t, n) => void 0);
  });
  function qs() {
    return Ka(Ks);
  }
  var Js = A(`ZodNever`, (e, t) => {
    Ni.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => ko(e, t, n, r));
  });
  function Ys(e) {
    return qa(Js, e);
  }
  var Xs = A(`ZodArray`, (e, t) => {
    Fi.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Po(e, t, n, r)),
      (e.element = t.element),
      hs(e, `ZodArray`, {
        min(e, t) {
          return this.check(eo(e, t));
        },
        nonempty(e) {
          return this.check(eo(1, e));
        },
        max(e, t) {
          return this.check($a(e, t));
        },
        length(e, t) {
          return this.check(to(e, t));
        },
        unwrap() {
          return this.element;
        },
      });
  });
  function Zs(e, t) {
    return ho(Xs, e, t);
  }
  var Qs = A(`ZodObject`, (e, t) => {
    Ri.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Fo(e, t, n, r)),
      j(e, `shape`, () => t.shape),
      hs(e, `ZodObject`, {
        keyof() {
          return lc(Object.keys(this._zod.def.shape));
        },
        catchall(e) {
          return this.clone({ ...this._zod.def, catchall: e });
        },
        passthrough() {
          return this.clone({ ...this._zod.def, catchall: qs() });
        },
        loose() {
          return this.clone({ ...this._zod.def, catchall: qs() });
        },
        strict() {
          return this.clone({ ...this._zod.def, catchall: Ys() });
        },
        strip() {
          return this.clone({ ...this._zod.def, catchall: void 0 });
        },
        extend(e) {
          return Dn(this, e);
        },
        safeExtend(e) {
          return On(this, e);
        },
        merge(e) {
          return kn(this, e);
        },
        pick(e) {
          return Tn(this, e);
        },
        omit(e) {
          return En(this, e);
        },
        partial(...e) {
          return An(pc, this, e[0]);
        },
        required(...e) {
          return jn(Cc, this, e[0]);
        },
      });
  });
  function $s(e, t) {
    return new Qs({ type: `object`, shape: e ?? {}, ...M(t) });
  }
  var ec = A(`ZodUnion`, (e, t) => {
    Bi.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Io(e, t, n, r)),
      (e.options = t.options);
  });
  function tc(e, t) {
    return new ec({ type: `union`, options: e, ...M(t) });
  }
  var nc = A(`ZodDiscriminatedUnion`, (e, t) => {
    ec.init(e, t), Vi.init(e, t);
  });
  function rc(e, t, n) {
    return new nc({ type: `union`, options: t, discriminator: e, ...M(n) });
  }
  var ic = A(`ZodIntersection`, (e, t) => {
    Hi.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Lo(e, t, n, r));
  });
  function ac(e, t) {
    return new ic({ type: `intersection`, left: e, right: t });
  }
  var oc = A(`ZodRecord`, (e, t) => {
    Gi.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Ro(e, t, n, r)),
      (e.keyType = t.keyType),
      (e.valueType = t.valueType);
  });
  function sc(e, t, n) {
    return !t || !t._zod
      ? new oc({ type: `record`, keyType: z(), valueType: e, ...M(t) })
      : new oc({ type: `record`, keyType: e, valueType: t, ...M(n) });
  }
  var cc = A(`ZodEnum`, (e, t) => {
    Ki.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Ao(e, t, n, r)),
      (e.enum = t.entries),
      (e.options = Object.values(t.entries));
    const n = new Set(Object.keys(t.entries));
    (e.extract = (e, r) => {
      const i = {};
      for (const r of e)
        if (n.has(r)) i[r] = t.entries[r];
        else throw Error(`Key ${r} not found in enum`);
      return new cc({ ...t, checks: [], ...M(r), entries: i });
    }),
      (e.exclude = (e, r) => {
        const i = { ...t.entries };
        for (const t of e)
          if (n.has(t)) delete i[t];
          else throw Error(`Key ${t} not found in enum`);
        return new cc({ ...t, checks: [], ...M(r), entries: i });
      });
  });
  function lc(e, t) {
    return new cc({
      type: `enum`,
      entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
      ...M(t),
    });
  }
  var uc = A(`ZodLiteral`, (e, t) => {
    qi.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => jo(e, t, n, r)),
      (e.values = new Set(t.values)),
      Object.defineProperty(e, "value", {
        get() {
          if (t.values.length > 1)
            throw Error(
              "This schema contains multiple valid literal values. Use `.values` instead.",
            );
          return t.values[0];
        },
      });
  });
  function V(e, t) {
    return new uc({
      type: `literal`,
      values: Array.isArray(e) ? e : [e],
      ...M(t),
    });
  }
  var dc = A(`ZodTransform`, (e, t) => {
    Ji.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => No(e, t, n, r)),
      (e._zod.parse = (n, r) => {
        if (r.direction === `backward`) throw new en(e.constructor.name);
        n.addIssue = (r) => {
          if (typeof r == `string`) n.issues.push(Rn(r, n.value, t));
          else {
            const t = r;
            t.fatal && (t.continue = !1),
              (t.code ??= `custom`),
              (t.input ??= n.value),
              (t.inst ??= e),
              n.issues.push(Rn(t));
          }
        };
        const i = t.transform(n.value, n);
        return i instanceof Promise
          ? i.then((e) => ((n.value = e), (n.fallback = !0), n))
          : ((n.value = i), (n.fallback = !0), n);
      });
  });
  function fc(e) {
    return new dc({ type: `transform`, transform: e });
  }
  var pc = A(`ZodOptional`, (e, t) => {
    Xi.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Ko(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function mc(e) {
    return new pc({ type: `optional`, innerType: e });
  }
  var hc = A(`ZodExactOptional`, (e, t) => {
    Zi.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Ko(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function gc(e) {
    return new hc({ type: `optional`, innerType: e });
  }
  var _c = A(`ZodNullable`, (e, t) => {
    Qi.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => zo(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function vc(e) {
    return new _c({ type: `nullable`, innerType: e });
  }
  var yc = A(`ZodDefault`, (e, t) => {
    $i.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Vo(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType),
      (e.removeDefault = e.unwrap);
  });
  function bc(e, t) {
    return new yc({
      type: `default`,
      innerType: e,
      get defaultValue() {
        return typeof t == `function` ? t() : yn(t);
      },
    });
  }
  var xc = A(`ZodPrefault`, (e, t) => {
    ta.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Ho(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function Sc(e, t) {
    return new xc({
      type: `prefault`,
      innerType: e,
      get defaultValue() {
        return typeof t == `function` ? t() : yn(t);
      },
    });
  }
  var Cc = A(`ZodNonOptional`, (e, t) => {
    na.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Bo(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function wc(e, t) {
    return new Cc({ type: `nonoptional`, innerType: e, ...M(t) });
  }
  var Tc = A(`ZodCatch`, (e, t) => {
    ia.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Uo(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType),
      (e.removeCatch = e.unwrap);
  });
  function Ec(e, t) {
    return new Tc({
      type: `catch`,
      innerType: e,
      catchValue: typeof t == `function` ? t : () => t,
    });
  }
  var Dc = A(`ZodPipe`, (e, t) => {
    aa.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Wo(e, t, n, r)),
      (e.in = t.in),
      (e.out = t.out);
  });
  function Oc(e, t) {
    return new Dc({ type: `pipe`, in: e, out: t });
  }
  var kc = A(`ZodReadonly`, (e, t) => {
    sa.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Go(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function Ac(e) {
    return new kc({ type: `readonly`, innerType: e });
  }
  var jc = A(`ZodCustom`, (e, t) => {
    la.init(e, t),
      gs.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => Mo(e, t, n, r));
  });
  function Mc(e, t = {}) {
    return go(jc, e, t);
  }
  function Nc(e, t) {
    return L(e, t);
  }
  var Pc = z().trim().min(1).max(128),
    Fc = z().trim().min(1).max(128),
    Ic = $s({
      questionId: Pc,
      position: B().int().positive(),
      total: B().int().positive(),
      predictionEdition: Fc,
    })
      .strict()
      .superRefine((e, t) => {
        e.position > e.total &&
          t.addIssue({
            code: `custom`,
            message: `position exceeds total`,
            path: [`position`],
          });
      });
  B().int().nonnegative().brand();
  var Lc = $s({
      predictionEdition: Fc,
      questionId: Pc,
      sitePosition: B().int().positive(),
      siteTotal: B().int().positive(),
      tags: Zs(z().trim().min(1).max(128)).max(64),
      mediaLocator: z().trim().min(1).max(2048).optional(),
      discoveredAt: z().datetime(),
      schemaVersion: B().int().positive(),
    })
      .strict()
      .superRefine((e, t) => {
        e.sitePosition > e.siteTotal &&
          t.addIssue({
            code: `custom`,
            message: `sitePosition exceeds siteTotal`,
            path: [`sitePosition`],
          });
      }),
    Rc = $s({
      predictionEdition: Fc,
      orderedQuestionIds: Zs(Pc),
      siteTotal: B().int().positive(),
      completeness: lc([`complete`, `partial`]),
      checkpointPosition: B().int().positive().optional(),
      schemaVersion: B().int().positive(),
    })
      .strict()
      .superRefine((e, t) => {
        new Set(e.orderedQuestionIds).size !== e.orderedQuestionIds.length &&
          t.addIssue({
            code: `custom`,
            message: `question IDs must be unique`,
            path: [`orderedQuestionIds`],
          }),
          e.orderedQuestionIds.length > e.siteTotal &&
            t.addIssue({
              code: `custom`,
              message: `snapshot exceeds site total`,
              path: [`orderedQuestionIds`],
            }),
          e.completeness === `complete` &&
            e.orderedQuestionIds.length !== e.siteTotal &&
            t.addIssue({
              code: `custom`,
              message: `complete snapshot must cover 1..N`,
              path: [`orderedQuestionIds`],
            }),
          e.checkpointPosition !== void 0 &&
            e.checkpointPosition > e.siteTotal &&
            t.addIssue({
              code: `custom`,
              message: `checkpointPosition exceeds siteTotal`,
              path: [`checkpointPosition`],
            });
      }),
    zc = lc([
      `missing`,
      `extra`,
      `spelling`,
      `substitution`,
      `order`,
      `word_form`,
    ]),
    H = $s({ expected: z().max(256), actual: z().max(256), type: zc }).strict(),
    Bc = $s({
      attemptId: z().uuid(),
      questionId: Pc,
      accuracy: B().finite().min(0).max(1),
      durationMs: B().int().nonnegative(),
      replayCount: B().int().nonnegative(),
      errors: Zs(H).max(512),
      completedAt: z().datetime(),
    }).strict(),
    Vc = $s({
      questionId: Pc,
      dueScore: B().finite().min(0).max(1),
      weaknessScore: B().finite().min(0).max(1),
      noveltyScore: B().finite().min(0).max(1),
      marked: Us(),
      attemptCount: B().int().nonnegative(),
      lastAttemptAt: z().datetime().nullable(),
    }).strict(),
    Hc = $s({
      predictionEdition: Fc,
      questionId: Pc,
      text: z().max(2e4),
      revision: B().int().nonnegative(),
      updatedAt: z().datetime(),
    }).strict();
  $s({
    questionId: Pc,
    dueAt: z().datetime().nullable(),
    attemptCount: B().int().nonnegative(),
    errorCount: B().int().nonnegative(),
    lastAccuracy: B().finite().min(0).max(1).nullable(),
    lastAttemptAt: z().datetime().nullable(),
    marked: Us(),
  }).strict();
  var Uc = $s({ question: Ic.nullable(), draft: Hc.nullable() }).strict(),
    Wc = $s({
      learnerStateVersion: B().int().nonnegative(),
      candidates: Zs(Vc).max(500),
    }).strict(),
    Gc = lc([`practice`, `exam`]),
    Kc = lc([`site-player-only`, `transfer-to-extension`]),
    qc = $s({
      id: V(`current`),
      mode: Gc,
      audioStrategy: Kc,
      keymap: sc(z().min(1).max(64), z().min(1).max(64)),
      updatedAt: z().datetime(),
    }).strict(),
    Jc = $s({
      key: z().min(1).max(1024),
      expected: z().max(256),
      actual: z().max(256),
      type: H.shape.type,
      occurrences: B().int().positive(),
      lastSeenAt: z().datetime(),
    }).strict(),
    Yc = z().uuid(),
    Xc = (e) => $s({ requestId: Yc, ...e }).strict(),
    Zc = rc(`action`, [
      Xc({
        action: V(`storage/loadDraft`),
        predictionEdition: Fc,
        questionId: Pc,
      }),
      Xc({ action: V(`storage/saveDraft`), draft: Hc }),
      Xc({
        action: V(`storage/commitAttempt`),
        predictionEdition: Fc,
        attempt: Bc,
      }),
      Xc({
        action: V(`storage/setMarked`),
        predictionEdition: Fc,
        questionId: Pc,
        marked: Us(),
      }),
      Xc({
        action: V(`storage/getRankCandidates`),
        predictionEdition: Fc,
        questionIds: Zs(Pc).min(1).max(500),
      }),
      Xc({ action: V(`storage/restoreSession`) }),
      Xc({ action: V(`storage/saveSession`), question: Ic }),
      Xc({ action: V(`storage/loadIndexSnapshot`), predictionEdition: Fc }),
      Xc({
        action: V(`storage/saveIndexSnapshot`),
        snapshot: Rc,
        questions: Zs(Lc),
      }),
      Xc({ action: V(`storage/loadSettings`) }),
      Xc({ action: V(`storage/saveSettings`), settings: qc }),
      Xc({
        action: V(`storage/listWordStats`),
        limit: B().int().positive().max(500),
      }),
      Xc({
        action: V(`storage/matchVerifiedEdition`),
        questionId: Pc,
        position: B().int().positive(),
        total: B().int().positive(),
      }),
    ]),
    Qc = (e) => $s({ requestId: Yc, ok: V(!0), ...e }).strict(),
    $c = rc(`action`, [
      Qc({ action: V(`storage/loadDraft`), draft: Hc.nullable() }),
      Qc({ action: V(`storage/saveDraft`) }),
      Qc({ action: V(`storage/commitAttempt`) }),
      Qc({ action: V(`storage/setMarked`) }),
      Qc({ action: V(`storage/getRankCandidates`), snapshot: Wc }),
      Qc({ action: V(`storage/restoreSession`), session: Uc }),
      Qc({ action: V(`storage/saveSession`) }),
      Qc({
        action: V(`storage/loadIndexSnapshot`),
        snapshot: Rc.nullable(),
        questions: Zs(Lc),
      }),
      Qc({ action: V(`storage/saveIndexSnapshot`) }),
      Qc({ action: V(`storage/loadSettings`), settings: qc.nullable() }),
      Qc({ action: V(`storage/saveSettings`) }),
      Qc({ action: V(`storage/listWordStats`), words: Zs(Jc) }),
      Qc({ action: V(`storage/matchVerifiedEdition`), edition: Fc.nullable() }),
    ]),
    el = lc([`invalid-request`, `storage-failure`]),
    tl = tc([
      $c,
      $s({
        requestId: Yc,
        ok: V(!1),
        action: z().min(1).max(128),
        reason: el,
      }).strict(),
    ]);
  $s({
    code: lc([
      `AUTH_REQUIRED`,
      `SITE_CHANGED`,
      `DESYNC`,
      `AUDIO_ERROR`,
      `INDEX_PARTIAL`,
      `STORAGE_ERROR`,
    ]),
    message: z().trim().min(1).max(1024),
    recoverable: Us(),
    details: sc(z(), tc([z(), B().finite(), Us(), Gs()])).optional(),
  }).strict();
  var nl = class {
    async loadDraft(e, t) {
      return U(
        await this.send({
          requestId: crypto.randomUUID(),
          action: `storage/loadDraft`,
          predictionEdition: e,
          questionId: t,
        }),
        `storage/loadDraft`,
      ).draft;
    }
    async saveDraft(e) {
      await this.send({
        requestId: crypto.randomUUID(),
        action: `storage/saveDraft`,
        draft: e,
      });
    }
    async commitAttempt(e, t) {
      await this.send({
        requestId: crypto.randomUUID(),
        action: `storage/commitAttempt`,
        predictionEdition: e,
        attempt: t,
      });
    }
    async setMarked(e, t, n) {
      await this.send({
        requestId: crypto.randomUUID(),
        action: `storage/setMarked`,
        predictionEdition: e,
        questionId: t,
        marked: n,
      });
    }
    async saveSession(e) {
      await this.send({
        requestId: crypto.randomUUID(),
        action: `storage/saveSession`,
        question: e,
      });
    }
    async restoreSession() {
      return U(
        await this.send({
          requestId: crypto.randomUUID(),
          action: `storage/restoreSession`,
        }),
        `storage/restoreSession`,
      ).session;
    }
    async saveIndexSnapshot(e, t) {
      await this.send({
        requestId: crypto.randomUUID(),
        action: `storage/saveIndexSnapshot`,
        snapshot: e,
        questions: t,
      });
    }
    async loadIndexSnapshot(e) {
      const t = U(
        await this.send({
          requestId: crypto.randomUUID(),
          action: `storage/loadIndexSnapshot`,
          predictionEdition: e,
        }),
        `storage/loadIndexSnapshot`,
      );
      return { snapshot: t.snapshot, questions: t.questions };
    }
    async getRankCandidates(e, t) {
      return U(
        await this.send({
          requestId: crypto.randomUUID(),
          action: `storage/getRankCandidates`,
          predictionEdition: e,
          questionIds: t,
        }),
        `storage/getRankCandidates`,
      ).snapshot;
    }
    async loadSettings() {
      return U(
        await this.send({
          requestId: crypto.randomUUID(),
          action: `storage/loadSettings`,
        }),
        `storage/loadSettings`,
      ).settings;
    }
    async saveSettings(e) {
      await this.send({
        requestId: crypto.randomUUID(),
        action: `storage/saveSettings`,
        settings: e,
      });
    }
    async matchVerifiedEdition(e) {
      return U(
        await this.send({
          requestId: crypto.randomUUID(),
          action: `storage/matchVerifiedEdition`,
          questionId: e.questionId,
          position: e.position,
          total: e.total,
        }),
        `storage/matchVerifiedEdition`,
      ).edition;
    }
    async listWordStats(e = 200) {
      return U(
        await this.send({
          requestId: crypto.randomUUID(),
          action: `storage/listWordStats`,
          limit: e,
        }),
        `storage/listWordStats`,
      ).words;
    }
    async send(e) {
      const t = Zc.parse(e),
        n = await pe.runtime.sendMessage(t),
        r = tl.parse(n);
      if (r.requestId !== t.requestId || r.action !== t.action)
        throw Error(`runtime:response-mismatch`);
      if (!r.ok) throw Error(`runtime:${r.reason}`);
      return r;
    }
  };
  function U(e, t) {
    if (!e.ok || e.action !== t) throw Error(`runtime:action-mismatch`);
    return e;
  }
  var rl = new Set([`ANSWERING`, `REVIEW`, `COMMAND`, `DESYNC`]);
  function il(e) {
    return rl.has(e);
  }
  function al(e, t) {
    return (
      e.predictionEdition === t.predictionEdition &&
      e.questionId === t.questionId &&
      e.position === t.position &&
      e.total === t.total &&
      e.navigationEpoch === t.navigationEpoch &&
      e.initializeGeneration === t.initializeGeneration
    );
  }
  async function ol(e) {
    try {
      await e.run(), e.isCurrent() && e.onSuccess();
    } catch (t) {
      e.isCurrent() && e.onError(t);
    }
  }
  function sl(e) {
    return e.ok
      ? `verified`
      : e.diagnostic.detail === `question:prediction-edition-unverified`
        ? `session`
        : `reject`;
  }
  function cl(e) {
    return (
      e.code !== `AUTH_REQUIRED` &&
      e.detail !== `question:prediction-edition-unverified` &&
      /:(?:missing|ambiguous)$/u.test(e.detail)
    );
  }
  function W(e) {
    return ![`session:`, `provisional:`].some((t) => e.startsWith(t));
  }
  var ll = class extends EventTarget {
      #e;
      #t;
      #n;
      #r = null;
      #i = null;
      #a = null;
      #o = null;
      #s = null;
      #c = null;
      #l = !1;
      #u = new Map();
      #d = new Map();
      #f = ml();
      #p = 0;
      #m = performance.now();
      #h = 0;
      #g = 0;
      #_ = !1;
      #v = `ANSWERING`;
      #y = 0;
      #b = 0;
      #x = Promise.resolve();
      #S = null;
      #C = !1;
      #w = {
        phase: `PROBING`,
        mode: `practice`,
        identity: null,
        draft: ``,
        review: null,
        audioStatus: `EMPTY`,
        indexStatus: `IDLE`,
        siteStatus: `正在验证萤火虫页面`,
        notice: ``,
        marked: !1,
        words: [],
        rankedEntries: [],
        reviewQueue: null,
        keymap: { ...Te },
        fault: null,
      };
      constructor(e, t = window.document) {
        super(), (this.#n = e), (this.#e = new dt(t)), (this.#t = new nl());
      }
      get state() {
        return this.#w;
      }
      async initialize(e) {
        const t = ++this.#y,
          n = this.teardownActivePorts();
        if (
          ((this.#S = null),
          this.patch({
            phase: `PROBING`,
            siteStatus: `正在验证萤火虫页面`,
            reviewQueue: null,
            fault: null,
          }),
          await n,
          !this.isCurrentInitialization(t) ||
            (e && (await e, !this.isCurrentInitialization(t))))
        )
          return;
        let r = await this.probeWithGrace(t);
        if (!this.isCurrentInitialization(t)) return;
        if (sl(r) === `session`) {
          const e = await this.restoreVerifiedEditionFromStorage(t);
          if (!this.isCurrentInitialization(t)) return;
          e || this.#e.beginSessionPredictionEdition(), (r = this.#e.probe());
        }
        if (!r.ok) {
          const e = _l(r.diagnostic.code, r.diagnostic.detail);
          this.patch({
            phase:
              r.diagnostic.code === `AUTH_REQUIRED`
                ? `AUTH_REQUIRED`
                : `SITE_CHANGED`,
            siteStatus: r.diagnostic.detail,
            fault: e,
          });
          return;
        }
        const i = !W(r.identity.predictionEdition);
        (this.#l = i),
          (this.#r = new kt(this.#e)),
          (this.#i = new Je(this.#e)),
          this.#i.setNavigationEpoch(this.#r.epoch),
          (this.#g = this.#r.epoch);
        const a = new Qe(this.#e);
        (this.#a = a),
          a.addEventListener(`statechange`, (e) => {
            !this.isCurrentInitialization(t) ||
              this.#a !== a ||
              this.patch({ audioStatus: e.detail });
          });
        const o = i ? new ul() : new dl(this.#t);
        try {
          o instanceof dl && (await o.hydrate(r.identity.predictionEdition));
        } catch (e) {
          this.isCurrentInitialization(t) &&
            this.fail(`STORAGE_ERROR`, `周预测索引保存失败`, e);
          return;
        }
        if (
          !i &&
          o.hasCompleteEdition(
            r.identity.predictionEdition,
            r.identity.total,
          ) &&
          !o.isCompleteFor(r.identity)
        ) {
          this.#e.invalidateVerifiedPredictionEdition(
            r.identity.predictionEdition,
          ),
            this.isCurrentInitialization(t) &&
              (this.patch({
                phase: `PROBING`,
                indexStatus: `IDLE`,
                notice: `周预测题集已变化，正在重新验证`,
              }),
              await this.initialize());
          return;
        }
        if (!this.isCurrentInitialization(t)) return;
        (this.#s = o),
          (this.#o = new Nt(this.#e, this.#r, o)),
          this.#r.addEventListener(`navigationstart`, (e) => {
            if (!this.isCurrentInitialization(t)) return;
            const { epoch: n } = e.detail;
            (this.#g = n),
              this.#i?.setNavigationEpoch(n),
              this.#a?.invalidate(),
              this.patch({
                phase: `NAVIGATING`,
                review: null,
                audioStatus: `EMPTY`,
                siteStatus: `正在验证切题结果`,
              });
          }),
          this.#r.addEventListener(`manualchange`, (e) => {
            if (!this.isCurrentInitialization(t)) return;
            const n = e.detail,
              r = this.#w.identity;
            if (
              r &&
              (r.predictionEdition !== n.identity.predictionEdition ||
                r.total !== n.identity.total)
            ) {
              this.patch({
                phase: `PROBING`,
                indexStatus: `IDLE`,
                notice: `周预测题集已变化，正在重新验证`,
              }),
                this.initialize(this.flushDraft().catch(() => void 0));
              return;
            }
            if (
              this.#w.indexStatus === `INDEXING` ||
              this.#w.indexStatus === `PAUSED`
            ) {
              this.#o?.cancel(),
                this.patch({
                  indexStatus: `PARTIAL`,
                  notice: `检测到原网页手动切题；索引已取消并正在恢复起始题`,
                });
              return;
            }
            this.acceptQuestion(n.identity, n.epoch, !0);
          });
        const [s, c] = await Promise.all([
          this.#t.loadSettings().catch(() => null),
          i
            ? Promise.resolve(null)
            : this.#t.restoreSession().catch(() => null),
        ]);
        if (!this.isCurrentInitialization(t)) return;
        const l = this.#r;
        if (!l) return;
        let u = r.identity;
        if (
          (c?.question &&
            c.question.predictionEdition === r.identity.predictionEdition &&
            c.question.total === r.identity.total &&
            c.question.questionId !== r.identity.questionId &&
            (u = await this.restoreQuestion(c.question, l).catch(() =>
              this.#e.readIdentity(),
            )),
          !this.isCurrentInitialization(t))
        )
          return;
        const [d, f] = await Promise.all([
          this.safeLoadDraft(u),
          this.readMarked(u),
        ]);
        if (!this.isCurrentInitialization(t)) return;
        const p = this.#e.readIdentity();
        if (
          p.questionId !== u.questionId ||
          p.position !== u.position ||
          p.predictionEdition !== u.predictionEdition ||
          l.epoch !== this.#g
        ) {
          this.patch({
            phase: `PROBING`,
            siteStatus: `题目变化，正在重新同步`,
            notice: ``,
          }),
            queueMicrotask(() => {
              this.isCurrentInitialization(t) && this.initialize();
            });
          return;
        }
        this.#f = s ? hl(s) : ml();
        try {
          await this.persistSession(u);
        } catch (e) {
          this.isCurrentInitialization(t) &&
            this.fail(`STORAGE_ERROR`, `当前题会话保存失败`, e);
          return;
        }
        this.isCurrentInitialization(t) &&
          (l.epoch !== this.#g ||
            !this.isSiteAt(u) ||
            (this.#a.setMode(this.#f.mode),
            this.#a.bind(u.questionId, l.epoch),
            this.patch({
              phase: `ANSWERING`,
              mode: this.#f.mode,
              keymap: { ...this.#f.keymap },
              identity: u,
              draft: d,
              marked: f,
              siteStatus: `已同步`,
              audioStatus: `EMPTY`,
              indexStatus: o.isCompleteFor(u)
                ? `COMPLETE`
                : o.snapshot
                  ? `PARTIAL`
                  : `IDLE`,
            }),
            (this.#m = performance.now()),
            o.isCompleteFor(u) || this.discoverIndex()));
      }
      async submit() {
        if (this.#w.phase !== `ANSWERING` || !this.#w.identity || !this.#i)
          return;
        const e = this.#n().trim();
        if (!e) {
          this.patch({ notice: `先输入听到的句子` });
          return;
        }
        const t = this.#w.identity,
          n = this.#g;
        this.patch({ phase: `SUBMITTING`, notice: `正在调用萤火虫评分` });
        try {
          const r = await this.#i.submit(e);
          if (
            r.context.questionId !== t.questionId ||
            !this.isCurrentQuestion(t, n)
          )
            throw Error(`submission:question-mismatch`);
          const i = r.review,
            a = {
              attemptId: crypto.randomUUID(),
              questionId: t.questionId,
              accuracy: i.accuracy,
              durationMs: Math.max(0, Math.round(performance.now() - this.#m)),
              replayCount: this.#h,
              errors: i.errors,
              completedAt: new Date().toISOString(),
            };
          if (
            (W(t.predictionEdition) &&
              (await this.#t.commitAttempt(t.predictionEdition, a)),
            !this.isCurrentQuestion(t, n))
          )
            return;
          this.patch({
            phase: `REVIEW`,
            review: i,
            notice: this.#l
              ? `本次结果仅保留在当前会话；完成索引后可保存本地记录`
              : i.errors.length
                ? `已记录错词`
                : `完全正确`,
          });
        } catch (e) {
          if (!this.isCurrentQuestion(t, n)) return;
          this.fail(`DESYNC`, `提交链路已暂停`, e);
        }
      }
      async navigate(e) {
        const t = this.#r,
          n = this.#w.identity,
          r = this.#g,
          i = this.#y;
        if (!(!t || !n || !il(this.#w.phase))) {
          if (this.#S) {
            const t = Xt(this.#S, n.questionId, e);
            if (t.kind === `hold`) {
              this.patch({ notice: `已经是错题集第一题` });
              return;
            }
            if (t.kind === `finished`) {
              (this.#S = null),
                this.patch({
                  reviewQueue: null,
                  notice: `错题集刷完一轮；已恢复正常切题`,
                });
              return;
            }
            await this.navigateToQuestion(t.questionId);
            return;
          }
          if (
            (this.patch({
              phase: `NAVIGATING`,
              notice: ``,
              siteStatus: `正在切题`,
            }),
            await this.flushDraft().catch(() => void 0),
            this.isCurrentNavigationOperation(t, n, n, r, i))
          )
            try {
              const r = await t.navigate({ kind: e });
              if (
                !this.isCurrentNavigationOperation(t, n, r.identity, r.epoch, i)
              )
                return;
              await this.acceptQuestion(r.identity, r.epoch, !1);
            } catch (e) {
              this.shouldReportNavigationFailure(t, n, i) &&
                this.fail(`DESYNC`, `切题未被萤火虫确认`, e);
            }
        }
      }
      async navigateToQuestion(e) {
        const t = this.#w.identity,
          n = this.#r,
          r = this.#y,
          i = this.#g;
        if (
          !t ||
          !n ||
          !new Set([`ANSWERING`, `REVIEW`, `COMMAND`]).has(this.#w.phase)
        )
          return;
        if (!W(t.predictionEdition)) {
          this.patch({ notice: `当前题集仅会话可用；请用上一题/下一题导航` });
          return;
        }
        const a =
          this.#w.phase === `REVIEW`
            ? `REVIEW`
            : this.#w.phase === `COMMAND`
              ? this.#v
              : `ANSWERING`;
        this.patch({ phase: `NAVIGATING`, siteStatus: `正在读取复习索引` });
        let o;
        try {
          ({ questions: o } = await this.#t.loadIndexSnapshot(
            t.predictionEdition,
          ));
        } catch {
          this.patch({ phase: a, notice: `读取复习索引失败` });
          return;
        }
        if (!this.isCurrentNavigationOperation(n, t, t, i, r)) return;
        const s = o.find((t) => t.questionId === e);
        if (!s) {
          this.patch({ phase: a, notice: `索引中没有该题` });
          return;
        }
        if (
          (await this.flushDraft().catch(() => void 0),
          this.isCurrentNavigationOperation(n, t, t, i, r))
        ) {
          this.patch({ siteStatus: `正在跳转复习题` });
          try {
            let e,
              a = t,
              o = i;
            if (this.#e.capabilities().select)
              (e = await n.navigate({
                kind: `select`,
                position: s.sitePosition,
                expectedQuestionId: s.questionId,
              })),
                (a = e.identity),
                (o = e.epoch);
            else
              for (; n.current.position !== s.sitePosition; ) {
                if (!this.isCurrentNavigationOperation(n, t, a, o, r)) return;
                (e = await n.navigate({
                  kind:
                    n.current.position < s.sitePosition ? `next` : `previous`,
                })),
                  (a = e.identity),
                  (o = e.epoch);
              }
            const c = e ?? { identity: n.current, epoch: n.epoch };
            if (
              !this.isCurrentNavigationOperation(n, t, c.identity, c.epoch, r)
            )
              return;
            if (c.identity.questionId !== s.questionId)
              throw Error(`navigation:index-mismatch`);
            await this.acceptQuestion(c.identity, c.epoch, !1);
          } catch (e) {
            this.shouldReportNavigationFailure(n, t, r) &&
              this.fail(`DESYNC`, `索引跳转未被萤火虫确认`, e);
          }
        }
      }
      async redo() {
        if (this.#w.phase !== `REVIEW` || !this.#i || !this.#w.identity) return;
        const e = this.#i,
          t = {
            predictionEdition: this.#w.identity.predictionEdition,
            questionId: this.#w.identity.questionId,
            position: this.#w.identity.position,
            total: this.#w.identity.total,
            navigationEpoch: this.#g,
            initializeGeneration: this.#y,
          };
        this.patch({ phase: `RESETTING`, review: null, notice: `` }),
          await ol({
            run: () => e.redo(),
            isCurrent: () => this.isCurrentRedo(t, e),
            onSuccess: () => {
              (this.#h = 0),
                (this.#m = performance.now()),
                this.patch({
                  phase: `ANSWERING`,
                  draft: ``,
                  review: null,
                  notice: `已重置本题`,
                });
            },
            onError: (e) => {
              this.fail(`DESYNC`, `重做未被萤火虫确认`, e);
            },
          });
      }
      async play() {
        const e = this.#a,
          t = this.#w.identity,
          n = this.#g,
          r = this.#y;
        if (!(!e || !t || this.#_)) {
          this.#_ = !0;
          try {
            if ((await e.play(), !this.isCurrentAudioOperation(e, t, n, r)))
              return;
            (this.#h += 1), this.patch({ notice: `` });
          } catch (i) {
            if (!this.isCurrentAudioOperation(e, t, n, r)) return;
            const a = vl(i);
            if (a === `audio:needs-gesture`) {
              this.patch({
                notice: `浏览器拦截了自动播放；按 Alt+P 或点击播放`,
              });
              return;
            }
            if (a === `audio:not-ready`) {
              this.patch({ notice: `音频尚未就绪；稍候一秒再按 Alt+P` });
              return;
            }
            this.patch({ audioStatus: `AUDIO_ERROR`, notice: a });
          } finally {
            this.#_ = !1;
          }
        }
      }
      audioSnapshot() {
        return this.#a?.snapshot() ?? null;
      }
      async autoPlayAudio() {
        const e = this.#a,
          t = this.#w.identity,
          n = this.#g,
          r = this.#y;
        if (!(!e || !t || this.#_)) {
          this.#_ = !0;
          try {
            if ((await e.play(), !this.isCurrentAudioOperation(e, t, n, r)))
              return;
            (this.#h += 1), this.patch({ notice: `` });
          } catch {
            if (!this.isCurrentAudioOperation(e, t, n, r)) return;
            this.patch({
              audioStatus:
                this.#w.audioStatus === `AUDIO_ERROR`
                  ? `READY`
                  : this.#w.audioStatus,
              notice: `自动播放未成功；按 Alt+P 或点击底部播放`,
            });
          } finally {
            this.#_ = !1;
          }
        }
      }
      async restartAudio() {
        const e = this.#a,
          t = this.#w.identity,
          n = this.#g,
          r = this.#y;
        if (!(!e || !t || this.#_)) {
          this.#_ = !0;
          try {
            if ((await e.restart(), !this.isCurrentAudioOperation(e, t, n, r)))
              return;
            (this.#h += 1), this.patch({ notice: `` });
          } catch (i) {
            if (!this.isCurrentAudioOperation(e, t, n, r)) return;
            const a = vl(i);
            if (a === `audio:needs-gesture`) {
              this.patch({
                notice: `浏览器拦截了自动播放；按 Alt+P 或点击播放`,
              });
              return;
            }
            if (a === `audio:not-ready`) {
              this.patch({ notice: `音频尚未就绪；稍候一秒再按 Alt+P` });
              return;
            }
            this.patch({ audioStatus: `AUDIO_ERROR`, notice: a });
          } finally {
            this.#_ = !1;
          }
        }
      }
      setCommand(e) {
        e && (this.#w.phase === `ANSWERING` || this.#w.phase === `REVIEW`)
          ? ((this.#b += 1),
            (this.#v = this.#w.phase),
            this.patch({ phase: `COMMAND` }))
          : !e &&
            this.#w.phase === `COMMAND` &&
            ((this.#b += 1), this.patch({ phase: this.#v }));
      }
      async setMode(e) {
        this.#a?.setMode(e),
          (this.#f = {
            ...this.#f,
            mode: e,
            updatedAt: new Date().toISOString(),
          }),
          this.patch({
            mode: e,
            notice:
              e === `exam` ? `考试模式：每题只允许一次成功播放` : `练习模式`,
          }),
          await this.#t.saveSettings(this.#f).catch(() => void 0);
      }
      async saveKeymap(e) {
        const t = { ...Te, ...e };
        return ke(t)
          ? ((this.#f = {
              ...this.#f,
              keymap: t,
              updatedAt: new Date().toISOString(),
            }),
            await this.#t.saveSettings(this.#f),
            this.patch({ keymap: t, notice: `快捷键已保存` }),
            !0)
          : !1;
      }
      async toggleMarked() {
        const e = this.#w.identity;
        if (!e) return;
        const t = this.#g,
          n = !this.#w.marked;
        W(e.predictionEdition)
          ? await this.#t.setMarked(e.predictionEdition, e.questionId, n)
          : this.#d.set(pl(e), n),
          this.isCurrentQuestion(e, t) &&
            this.patch({ marked: n, notice: n ? `已标记` : `已取消标记` });
      }
      async loadWords() {
        this.patch({ words: await this.#t.listWordStats().catch(() => []) });
      }
      async loadRankedReview() {
        const e = this.#w.identity;
        if (!e || this.#w.phase !== `COMMAND`) return !1;
        if (!W(e.predictionEdition))
          return this.patch({ notice: `完整索引后才能生成本地复习顺序` }), !1;
        const t = this.#y,
          n = ++this.#b,
          r = () =>
            this.isCurrentInitialization(t) &&
            n === this.#b &&
            this.#w.phase === `COMMAND` &&
            fl(this.#w.identity, e);
        try {
          const { snapshot: t, questions: n } = await this.#t.loadIndexSnapshot(
            e.predictionEdition,
          );
          if (!r()) return !1;
          if (!t || n.length === 0)
            return (
              this.patch({
                notice: `题目索引尚未建立；先在命令层运行完整索引`,
              }),
              !1
            );
          const i = n.map((e) => e.questionId),
            a = await this.#t.getRankCandidates(e.predictionEdition, i);
          if (!r()) return !1;
          const o = a.candidates,
            s = Yt(o),
            c = await this.#t.loadIndexSnapshot(e.predictionEdition);
          if (
            !r() ||
            c.questions.map((e) => e.questionId).join(`\0`) !== i.join(`\0`)
          )
            return !1;
          const l = new Map(o.map((e) => [e.questionId, e])),
            u = s.map((e) => {
              const t = l.get(e),
                n = (t?.attemptCount ?? 0) > 0;
              return {
                questionId: e,
                attempted: n,
                wrong: n && (t?.weaknessScore ?? 0) > 0,
                due: n && (t?.dueScore ?? 0) >= 0.5,
                marked: t?.marked ?? !1,
              };
            });
          return (
            this.patch({
              rankedEntries: u,
              notice:
                t.completeness === `complete`
                  ? `本地复习顺序已生成`
                  : `已按部分索引生成本地复习顺序；可稍后补全索引`,
            }),
            !0
          );
        } catch (e) {
          return (
            r() && this.patch({ notice: `复习顺序生成失败：${vl(e)}` }), !1
          );
        }
      }
      async startWrongDrive(e) {
        const t = this.#w.identity;
        if (
          !t ||
          this.#w.phase !== `COMMAND` ||
          !W(t.predictionEdition) ||
          e.length === 0
        )
          return e.length === 0 && this.patch({ notice: `没有错题可刷` }), !1;
        this.#S = [...e];
        const n = Zt(this.#S, t.questionId);
        if (
          (this.patch({
            reviewQueue: { position: n ?? 1, total: this.#S.length },
            notice: `错题循环开启；Enter/J 只在错题之间切换`,
          }),
          n !== null)
        )
          return this.setCommand(!1), !0;
        const r = this.#S[0];
        return r && (await this.navigateToQuestion(r)), !0;
      }
      exitWrongDrive() {
        this.#S &&
          ((this.#S = null),
          this.patch({ reviewQueue: null, notice: `已退出错题循环` }));
      }
      async buildFullIndex() {
        if (this.#l) {
          await this.buildVerifiedIndexFromSession();
          return;
        }
        if (
          !this.#o ||
          !this.#r ||
          !this.#w.identity ||
          this.#w.phase !== `COMMAND`
        )
          return;
        const e = this.#o,
          t = this.#r,
          n = this.#w.identity,
          r = this.#y,
          i = () =>
            this.#o === e &&
            this.#r === t &&
            this.isCurrentInitialization(r) &&
            this.#w.phase === `NAVIGATING` &&
            fl(this.#w.identity, n),
          a = e.controlledTraversal(this.flushDraft());
        this.patch({
          phase: `NAVIGATING`,
          indexStatus: `INDEXING`,
          notice: `索引时请勿操作原网页`,
        });
        try {
          const o = await a;
          if (!i()) return;
          const s = this.#e.readIdentity();
          if (
            s.predictionEdition !== n.predictionEdition ||
            s.total !== n.total
          ) {
            this.initialize(this.flushDraft().catch(() => void 0));
            return;
          }
          const c = e.failureReason;
          if (
            (this.patch({
              indexStatus:
                o.completeness === `complete` ? `COMPLETE` : `PARTIAL`,
            }),
            await this.acceptQuestion(s, t.epoch, !1),
            !this.isCurrentInitialization(r) ||
              !this.isCurrentQuestion(s, t.epoch))
          )
            return;
          this.patch({
            notice:
              o.completeness === `complete`
                ? `已索引 ${o.siteTotal} 题`
                : c
                  ? `索引部分完成：${c}`
                  : `索引部分完成，可稍后继续`,
          });
        } catch (e) {
          i() &&
            (this.fail(`DESYNC`, `完整索引已暂停`, e),
            this.patch({ indexStatus: `FAILED` }));
        }
      }
      pauseIndex() {
        if (this.#c) {
          this.patch({ notice: `首次验证不能暂停；按 X 可取消并返回当前题` });
          return;
        }
        this.#o?.pause() &&
          this.patch({
            indexStatus: `PAUSED`,
            notice: `索引已暂停；Enter/R 继续，X 取消并返回起始题`,
          });
      }
      resumeIndex() {
        this.#o?.resume() &&
          this.patch({
            indexStatus: `INDEXING`,
            notice: `索引继续；请勿操作原网页`,
          });
      }
      cancelIndex() {
        if (this.#c?.cancel()) {
          this.patch({
            indexStatus: `PARTIAL`,
            notice: `正在取消完整验证并恢复当前题`,
          });
          return;
        }
        this.#o?.cancel() &&
          this.patch({
            indexStatus: `PARTIAL`,
            notice: `正在取消索引并恢复起始题`,
          });
      }
      async flushDraft() {
        const e = this.#w.identity;
        if (e) {
          if (!W(e.predictionEdition)) {
            this.#u.set(pl(e), this.#n());
            return;
          }
          (this.#p += 1),
            await this.#t.saveDraft({
              predictionEdition: e.predictionEdition,
              questionId: e.questionId,
              text: this.#n(),
              revision: this.#p,
              updatedAt: new Date().toISOString(),
            });
        }
      }
      dispose() {
        (this.#C = !0), (this.#y += 1), this.teardownActivePorts();
      }
      async restoreQuestion(e, t) {
        if (
          t.current.position === e.position &&
          t.current.questionId !== e.questionId
        )
          throw Error(`restore:stale-session`);
        if (this.#e.capabilities().select)
          return (
            await t.navigate({
              kind: `select`,
              position: e.position,
              expectedQuestionId: e.questionId,
            })
          ).identity;
        for (; t.current.position !== e.position; )
          await t.navigate({
            kind: t.current.position < e.position ? `next` : `previous`,
          });
        if (t.current.questionId !== e.questionId)
          throw Error(`restore:question-mismatch`);
        return t.current;
      }
      async buildVerifiedIndexFromSession() {
        const e = this.#w.identity;
        if (
          !e ||
          !(
            this.#w.phase === `ANSWERING` ||
            this.#w.phase === `REVIEW` ||
            this.#w.phase === `COMMAND`
          ) ||
          W(e.predictionEdition)
        )
          return;
        const t = this.#y,
          n = pl(e),
          r = this.#d.get(n) ?? !1;
        await this.flushDraft().catch(() => void 0);
        const i = this.#u.get(n) ?? ``;
        if (
          !this.isCurrentInitialization(t) ||
          (await this.teardownActivePorts(), !this.isCurrentInitialization(t))
        )
          return;
        const a = new Wt(this.#e);
        (this.#c = a),
          a.addEventListener(`progress`, (e) => {
            if (!this.isCurrentInitialization(t) || this.#c !== a) return;
            const { completed: n, total: r } = e.detail;
            this.patch({ notice: `正在验证并索引题集 ${n}/${r}` });
          }),
          this.patch({
            phase: `NAVIGATING`,
            indexStatus: `INDEXING`,
            siteStatus: `正在完整验证题集`,
            notice: `这是唯一会遍历全部题目的操作；按 X 可取消`,
          });
        let o = null;
        try {
          const n = await a.run();
          if (
            ((o = n.edition), !this.isCurrentInitialization(t) || this.#c !== a)
          )
            return;
          await new dl(this.#t).adoptBootstrap(n),
            i &&
              ((this.#p += 1),
              await this.#t
                .saveDraft({
                  predictionEdition: n.edition,
                  questionId: e.questionId,
                  text: i,
                  revision: this.#p,
                  updatedAt: new Date().toISOString(),
                })
                .catch(() => void 0)),
            r &&
              (await this.#t
                .setMarked(n.edition, e.questionId, !0)
                .catch(() => void 0)),
            this.#u.clear(),
            this.#d.clear(),
            (this.#c = null),
            await a.dispose(),
            await this.initialize(),
            this.#C ||
              this.patch({
                indexStatus: `COMPLETE`,
                notice: `已验证并索引 ${n.snapshot.siteTotal} 题；持久练习记录已启用`,
              });
        } catch (e) {
          if (!this.isCurrentInitialization(t) || this.#c !== a) return;
          (this.#c = null), await a.dispose();
          const n = vl(e);
          if (
            (o && this.#e.invalidateVerifiedPredictionEdition(o),
            await this.initialize(),
            !this.#C)
          ) {
            const e = this.#w.identity;
            if (e && !W(e.predictionEdition)) {
              const t = pl(e);
              this.#u.set(t, i), this.#d.set(t, r);
            }
            this.patch({
              indexStatus: `PARTIAL`,
              draft: i,
              marked: r,
              notice: `完整验证未完成：${n}；已返回当前页会话`,
            });
          }
        }
      }
      async acceptQuestion(e, t, n) {
        const r = this.#y;
        if (!this.isCurrentInitialization(r)) return;
        if (
          this.#s?.hasCompleteEdition(e.predictionEdition, e.total) &&
          !this.#s.isCompleteFor(e)
        ) {
          this.#e.invalidateVerifiedPredictionEdition(e.predictionEdition),
            this.patch({
              phase: `PROBING`,
              indexStatus: `IDLE`,
              notice: `检测到周预测题目变化，正在重新验证`,
            }),
            this.initialize(this.flushDraft().catch(() => void 0));
          return;
        }
        if (
          t !== this.#g ||
          (n &&
            this.#w.identity &&
            (await this.flushDraft().catch(() => void 0)),
          !this.isCurrentInitialization(r))
        )
          return;
        const [i, a] = await Promise.all([
          this.safeLoadDraft(e),
          this.readMarked(e),
        ]);
        if (!this.isCurrentInitialization(r) || t !== this.#g) return;
        const o = this.#e.readIdentity();
        if (
          !(
            o.questionId !== e.questionId ||
            o.position !== e.position ||
            o.predictionEdition !== e.predictionEdition
          )
        ) {
          try {
            await this.persistSession(e);
          } catch (n) {
            this.isCurrentInitialization(r) &&
              t === this.#g &&
              this.isSiteAt(e) &&
              this.fail(`STORAGE_ERROR`, `当前题会话保存失败`, n);
            return;
          }
          !this.isCurrentInitialization(r) ||
            t !== this.#g ||
            !this.isSiteAt(e) ||
            (this.#i?.setNavigationEpoch(t),
            this.#a?.bind(e.questionId, t),
            (this.#h = 0),
            (this.#m = performance.now()),
            this.patch({
              phase: `ANSWERING`,
              identity: e,
              draft: i,
              marked: a,
              review: null,
              notice: n ? `已跟随原网页切题` : ``,
              siteStatus: `已同步`,
              audioStatus: `EMPTY`,
              reviewQueue: this.#S
                ? {
                    position:
                      Zt(this.#S, e.questionId) ??
                      this.#w.reviewQueue?.position ??
                      1,
                    total: this.#S.length,
                  }
                : null,
              fault: null,
            }),
            this.#w.indexStatus !== `COMPLETE` &&
              (await this.#o?.learnCurrent().catch(() => void 0)));
        }
      }
      async readMarked(e) {
        return W(e.predictionEdition)
          ? ((
              await this.#t
                .getRankCandidates(e.predictionEdition, [e.questionId])
                .catch(() => null)
            )?.candidates[0]?.marked ?? !1)
          : (this.#d.get(pl(e)) ?? !1);
      }
      async persistSession(e) {
        if (!W(e.predictionEdition)) return;
        const t = this.#x
          .catch(() => void 0)
          .then(() => this.#t.saveSession(gl(e)));
        (this.#x = t), await t;
      }
      async safeLoadDraft(e) {
        if (!W(e.predictionEdition)) return this.#u.get(pl(e)) ?? ``;
        const t = await this.#t
          .loadDraft(e.predictionEdition, e.questionId)
          .catch(() => null);
        return t ? ((this.#p = Math.max(this.#p, t.revision)), t.text) : ``;
      }
      async discoverIndex() {
        const e = this.#o,
          t = this.#y;
        if (e) {
          this.patch({ indexStatus: `DISCOVERING` });
          try {
            const n = await e.discover();
            if (this.#o !== e || !this.isCurrentInitialization(t)) return;
            this.patch({
              indexStatus:
                n.completeness === `complete` ? `COMPLETE` : `PARTIAL`,
            });
          } catch {
            this.#o === e &&
              this.isCurrentInitialization(t) &&
              this.patch({ indexStatus: `FAILED` });
          }
        }
      }
      async restoreVerifiedEditionFromStorage(e) {
        const t = this.#e.readBareIdentity();
        if (!t) return !1;
        const n = await this.#t.matchVerifiedEdition(t).catch(() => null);
        return !this.isCurrentInitialization(e) || !n
          ? !1
          : this.#e.restoreVerifiedPredictionEdition(n, t.total);
      }
      async probeWithGrace(e) {
        let t = performance.now() + 2500,
          n = this.#e.probe();
        for (
          ;
          !n.ok &&
          cl(n.diagnostic) &&
          performance.now() < t &&
          this.isCurrentInitialization(e);
        ) {
          if (
            (await new Promise((e) => setTimeout(e, 150)),
            !this.isCurrentInitialization(e))
          )
            return n;
          n = this.#e.probe();
        }
        return n;
      }
      isCurrentInitialization(e) {
        return !this.#C && e === this.#y;
      }
      isCurrentAudioOperation(e, t, n, r) {
        return (
          this.#a === e &&
          this.isCurrentInitialization(r) &&
          this.isCurrentQuestion(t, n)
        );
      }
      isCurrentNavigationOperation(e, t, n, r, i) {
        if (
          this.#r !== e ||
          !this.isCurrentInitialization(i) ||
          this.#w.phase !== `NAVIGATING` ||
          this.#g !== r ||
          !fl(this.#w.identity, t)
        )
          return !1;
        try {
          return fl(this.#e.readIdentity(), n);
        } catch {
          return !1;
        }
      }
      isSiteAt(e) {
        try {
          return fl(this.#e.readIdentity(), e);
        } catch {
          return !1;
        }
      }
      shouldReportNavigationFailure(e, t, n) {
        return (
          this.#r === e &&
          this.isCurrentInitialization(n) &&
          this.#w.phase === `NAVIGATING` &&
          fl(this.#w.identity, t)
        );
      }
      isCurrentQuestion(e, t) {
        return (
          !this.#C &&
          t === this.#g &&
          fl(this.#w.identity, e) &&
          this.isSiteAt(e)
        );
      }
      isCurrentRedo(e, t) {
        if (
          this.#C ||
          this.#w.phase !== `RESETTING` ||
          this.#i !== t ||
          !al(e, {
            predictionEdition: this.#w.identity?.predictionEdition,
            questionId: this.#w.identity?.questionId,
            position: this.#w.identity?.position,
            total: this.#w.identity?.total,
            navigationEpoch: this.#g,
            initializeGeneration: this.#y,
          })
        )
          return !1;
        try {
          const t = this.#e.readIdentity();
          return al(e, {
            predictionEdition: t.predictionEdition,
            questionId: t.questionId,
            position: t.position,
            total: t.total,
            navigationEpoch: this.#g,
            initializeGeneration: this.#y,
          });
        } catch {
          return !1;
        }
      }
      async teardownActivePorts() {
        const e = this.#c;
        (this.#c = null),
          this.#o?.cancel(),
          this.#r?.dispose(),
          this.#a?.dispose(),
          (this.#r = null),
          (this.#i = null),
          (this.#a = null),
          (this.#o = null),
          (this.#s = null),
          e && (await e.dispose());
      }
      fail(e, t, n) {
        const r = vl(n);
        this.patch({
          phase: `DESYNC`,
          siteStatus: t,
          notice: r,
          fault: _l(e, r),
        });
      }
      patch(e) {
        (this.#w = { ...this.#w, ...e }),
          this.dispatchEvent(
            new CustomEvent(`statechange`, { detail: this.#w }),
          );
      }
    },
    ul = class {
      #e = new Map();
      #t = null;
      get snapshot() {
        return this.#t;
      }
      resumeSnapshot() {
        return this.#t;
      }
      resumeQuestions() {
        return [...this.#e.values()].sort(
          (e, t) => e.sitePosition - t.sitePosition,
        );
      }
      isCompleteFor(e) {
        return (
          this.hasCompleteEdition(e.predictionEdition, e.total) &&
          this.#e.get(e.position)?.questionId === e.questionId
        );
      }
      hasCompleteEdition(e, t) {
        return (
          this.#t?.completeness === `complete` &&
          this.#t.predictionEdition === e &&
          this.#t.siteTotal === t
        );
      }
      async saveQuestion(e) {
        this.#e.set(e.sitePosition, e);
      }
      async saveSnapshot(e) {
        const t = this.resumeQuestions().filter(
            (t) =>
              t.predictionEdition === e.predictionEdition &&
              t.siteTotal === e.siteTotal,
          ),
          n =
            e.completeness === `complete` &&
            t.length === e.siteTotal &&
            t.every((e, t) => e.sitePosition === t + 1);
        this.#t = {
          ...e,
          orderedQuestionIds: t.map((e) => e.questionId),
          completeness: n ? `complete` : `partial`,
        };
      }
    },
    dl = class {
      #e;
      #t = new Map();
      #n = null;
      constructor(e) {
        this.#e = e;
      }
      get snapshot() {
        return this.#n;
      }
      resumeSnapshot() {
        return this.#n;
      }
      resumeQuestions() {
        return this.#n
          ? [...this.#t.values()].filter(
              (e) =>
                e.predictionEdition === this.#n?.predictionEdition &&
                e.siteTotal === this.#n.siteTotal,
            )
          : [];
      }
      isCompleteFor(e) {
        return this.#n?.completeness !== `complete` ||
          this.#n.predictionEdition !== e.predictionEdition ||
          this.#n.siteTotal !== e.total
          ? !1
          : [...this.#t.values()].find(
              (t) =>
                t.predictionEdition === e.predictionEdition &&
                t.sitePosition === e.position,
            )?.questionId === e.questionId;
      }
      hasCompleteEdition(e, t) {
        return (
          this.#n?.completeness === `complete` &&
          this.#n.predictionEdition === e &&
          this.#n.siteTotal === t
        );
      }
      async adoptBootstrap(e) {
        if (
          !mt(e.edition, e.snapshot.siteTotal) ||
          e.snapshot.predictionEdition !== e.edition ||
          e.snapshot.completeness !== `complete` ||
          e.questions.length !== e.snapshot.siteTotal ||
          e.questions.some(
            (t, n) =>
              t.predictionEdition !== e.edition ||
              t.siteTotal !== e.snapshot.siteTotal ||
              t.sitePosition !== n + 1 ||
              t.questionId !== e.snapshot.orderedQuestionIds[n],
          )
        )
          throw Error(`index:invalid-bootstrap-result`);
        this.#t.clear(), (this.#n = null);
        for (const t of e.questions)
          this.#t.set(`${t.predictionEdition}:${t.questionId}`, t);
        await this.saveSnapshot(e.snapshot);
      }
      async hydrate(e) {
        const { snapshot: t, questions: n } = await this.#e
          .loadIndexSnapshot(e)
          .catch(() => ({ snapshot: null, questions: [] }));
        this.#n = t;
        for (const e of n)
          this.#t.set(`${e.predictionEdition}:${e.questionId}`, e);
      }
      async saveQuestion(e) {
        for (const [t, n] of this.#t)
          n.predictionEdition === e.predictionEdition &&
            n.sitePosition === e.sitePosition &&
            n.questionId !== e.questionId &&
            this.#t.delete(t);
        this.#t.set(`${e.predictionEdition}:${e.questionId}`, e);
      }
      async saveSnapshot(e) {
        const t = this.#n,
          n =
            e.completeness === `partial` &&
            t?.completeness === `complete` &&
            t.predictionEdition === e.predictionEdition &&
            t.siteTotal === e.siteTotal &&
            t.orderedQuestionIds.every((t, n) =>
              [...this.#t.values()].some(
                (r) =>
                  r.predictionEdition === e.predictionEdition &&
                  r.questionId === t &&
                  r.sitePosition === n + 1,
              ),
            )
              ? t
              : e,
          r =
            n.completeness === `complete`
              ? new Set(n.orderedQuestionIds)
              : null,
          i = [...this.#t.values()]
            .filter(
              (e) =>
                e.predictionEdition === n.predictionEdition &&
                (!r || r.has(e.questionId)),
            )
            .sort((e, t) => e.sitePosition - t.sitePosition),
          a =
            n.completeness === `complete` &&
            i.length === n.siteTotal &&
            i.every((e, t) => e.sitePosition === t + 1),
          o = {
            ...n,
            orderedQuestionIds: i.map((e) => e.questionId),
            completeness: a ? `complete` : `partial`,
          };
        (this.#n = o), await this.#e.saveIndexSnapshot(o, i);
      }
    };
  function fl(e, t) {
    return (
      e?.predictionEdition === t.predictionEdition &&
      e.questionId === t.questionId &&
      e.position === t.position &&
      e.total === t.total
    );
  }
  function pl(e) {
    return `${e.predictionEdition}:${e.questionId}`;
  }
  function ml() {
    return {
      id: `current`,
      mode: `practice`,
      audioStrategy: `site-player-only`,
      keymap: { ...Te },
      updatedAt: new Date().toISOString(),
    };
  }
  function hl(e) {
    return { ...e, keymap: { ...Te, ...e.keymap } };
  }
  function gl(e) {
    return {
      predictionEdition: e.predictionEdition,
      questionId: e.questionId,
      position: e.position,
      total: e.total,
    };
  }
  function _l(e, t) {
    return {
      code: new Set([
        `AUTH_REQUIRED`,
        `SITE_CHANGED`,
        `DESYNC`,
        `AUDIO_ERROR`,
        `INDEX_PARTIAL`,
        `STORAGE_ERROR`,
      ]).has(e)
        ? e
        : `SITE_CHANGED`,
      message: t,
      recoverable: !0,
    };
  }
  function vl(e) {
    return e instanceof Error ? e.message : `未知错误`;
  }
  var yl = o((e) => {
      var t = Symbol.for(`react.transitional.element`),
        n = Symbol.for(`react.fragment`);
      function r(e, n, r) {
        var i = null;
        if (
          (r !== void 0 && (i = `` + r),
          n.key !== void 0 && (i = `` + n.key),
          `key` in n)
        )
          for (var a in ((r = {}), n)) a !== `key` && (r[a] = n[a]);
        else r = n;
        return (
          (n = r.ref),
          {
            $$typeof: t,
            type: e,
            key: i,
            ref: n === void 0 ? null : n,
            props: r,
          }
        );
      }
      (e.Fragment = n), (e.jsx = r), (e.jsxs = r);
    }),
    G = o((e, t) => {
      t.exports = yl();
    })(),
    bl = class {
      #e = 0;
      #t = !1;
      get current() {
        return this.#e;
      }
      get busy() {
        return this.#t;
      }
      open() {
        return (this.#e += 1), (this.#t = !1), this.#e;
      }
      invalidate() {
        (this.#e += 1), (this.#t = !1);
      }
      isCurrent(e) {
        return e === this.#e;
      }
      start(e) {
        return !this.isCurrent(e) || this.#t ? !1 : ((this.#t = !0), !0);
      }
      finish(e) {
        return this.isCurrent(e) ? ((this.#t = !1), !0) : !1;
      }
    },
    xl = {
      phase: `PROBING`,
      mode: `practice`,
      identity: null,
      draft: ``,
      review: null,
      audioStatus: `EMPTY`,
      indexStatus: `IDLE`,
      siteStatus: `正在验证萤火虫页面`,
      notice: ``,
      marked: !1,
      words: [],
      rankedEntries: [],
      reviewQueue: null,
      keymap: { ...Te },
      fault: null,
    };
  function Sl() {
    const e = (0, O.useRef)(null),
      t = (0, O.useRef)(null),
      n = (0, O.useRef)(null),
      r = (0, O.useRef)(null),
      i = (0, O.useRef)(null),
      a = (0, O.useRef)(null),
      o = (0, O.useRef)(null),
      s = (0, O.useRef)(null),
      c = (0, O.useRef)(null),
      l = (0, O.useRef)(null),
      u = (0, O.useRef)(null),
      d = (0, O.useRef)(new Le()),
      f = (0, O.useRef)(new bl()),
      p = (0, O.useRef)(`none`),
      m = (0, O.useRef)(!0),
      h = (0, O.useRef)(null),
      g = (0, O.useRef)(0),
      _ = (0, O.useRef)(!0),
      v = (0, O.useRef)(xl.phase),
      y = (0, O.useRef)(``),
      [b, x] = (0, O.useState)(!0),
      [ee, te] = (0, O.useState)(`none`),
      [S, ne] = (0, O.useState)(!1),
      [re, ie] = (0, O.useState)(null),
      [ae, oe] = (0, O.useState)(!1),
      se = (0, O.useRef)(``),
      ce = (0, O.useRef)(0),
      [C, le] = (0, O.useState)(xl),
      w = (0, O.useCallback)((e) => {
        (p.current = e), te(e);
      }, []),
      ue = (0, O.useCallback)(() => {
        f.current.invalidate(), ne(!1);
      }, []),
      T = (0, O.useCallback)(() => {
        ue(), w(`none`);
        const t = u.current;
        t?.setCommand(!1);
        const n = t?.state.phase;
        requestAnimationFrame(() => {
          n === `REVIEW` ? i.current?.focus() : e.current?.focus();
        });
      }, [ue, w]),
      E = (0, O.useCallback)(() => {
        const e = u.current;
        !e ||
          (e.state.phase !== `ANSWERING` && e.state.phase !== `REVIEW`) ||
          (f.current.open(), ne(!1), w(`none`), e.setCommand(!0));
      }, [w]),
      de = (0, O.useCallback)(
        (t) => {
          const n = t ?? !m.current;
          n !== m.current &&
            ((m.current = n),
            ue(),
            w(`none`),
            n
              ? u.current?.state.phase === `COMMAND` && f.current.open()
              : (u.current?.state.indexStatus === `INDEXING` &&
                  u.current.pauseIndex(),
                (y.current = e.current?.value ?? y.current),
                u.current?.flushDraft().catch(() => void 0)),
            x(n));
        },
        [ue, w],
      ),
      fe = (0, O.useCallback)(() => {
        (y.current = ``),
          e.current &&
            ((e.current.value = ``),
            Ll(e.current, c.current),
            e.current.focus());
      }, []),
      pe = (0, O.useCallback)(
        async (e, t) => {
          const n = u.current,
            r = f.current,
            i = () =>
              r.isCurrent(t) && u.current === n && n?.state.phase === `COMMAND`;
          if (!n || !i()) return;
          if (e === `close-command` || e === `focus-input`) {
            T();
            return;
          }
          if (r.busy) return;
          const a = () => (i() ? (r.invalidate(), ne(!1), w(`none`), !0) : !1),
            o = async (e, n) => {
              if (r.start(t)) {
                ne(!0);
                try {
                  const t = await e();
                  i() && n(t);
                } finally {
                  r.finish(t) && ne(!1);
                }
              }
            };
          if (e === `play`) await o(() => n.play(), T);
          else if (e === `restart`) await o(() => n.restartAudio(), T);
          else if (e === `mark`) await o(() => n.toggleMarked(), T);
          else if (e === `toggle-mode`) {
            const e = n.state.mode === `practice` ? `exam` : `practice`;
            await o(() => n.setMode(e), T);
          } else if (e === `word-library`)
            await o(
              () => n.loadWords(),
              () => w(`words`),
            );
          else if (e === `ranked-review`)
            await o(
              () => n.loadRankedReview(),
              (e) => {
                e === !0 && w(`ranked`);
              },
            );
          else if (e === `settings`) w(`settings`);
          else if (e === `help`) w(`help`);
          else if (e === `next` || e === `previous`) {
            if (!a()) return;
            await n.navigate(e);
          } else if (e === `build-index`) {
            if (!a()) return;
            await n.buildFullIndex();
          }
        },
        [T, w],
      ),
      me = (0, O.useCallback)(
        async (e, t) => {
          const n = u.current,
            r = f.current;
          !n ||
            !r.isCurrent(t) ||
            r.busy ||
            n.state.phase !== `COMMAND` ||
            (r.invalidate(), ne(!1), w(`none`), await n.navigateToQuestion(e));
        },
        [w],
      ),
      he = (0, O.useCallback)(
        async (e, t) => {
          const n = u.current,
            r = f.current;
          !n ||
            !r.isCurrent(t) ||
            r.busy ||
            n.state.phase !== `COMMAND` ||
            (r.invalidate(), ne(!1), w(`none`), await n.startWrongDrive(e));
        },
        [w],
      );
    (0, O.useEffect)(() => {
      const t = new ll(() => e.current?.value ?? y.current);
      u.current = t;
      const n = (e) => {
        const t = e.detail;
        t.phase === `REVIEW` &&
          v.current === `SUBMITTING` &&
          (g.current = performance.now() + 400),
          (v.current = t.phase),
          le(t);
      };
      return (
        t.addEventListener(`statechange`, n),
        t.initialize(),
        () => {
          f.current.invalidate(),
            h.current && clearTimeout(h.current),
            t.flushDraft().catch(() => void 0),
            t.removeEventListener(`statechange`, n),
            t.dispose(),
            (u.current = null);
        }
      );
    }, []),
      (0, O.useEffect)(() => {
        const t = e.current;
        !t ||
          !C.identity ||
          ((y.current = C.draft), (t.value = C.draft), Ll(t, c.current));
      }, [C.identity, C.draft]),
      (0, O.useEffect)(() => {
        if (!b) return;
        const t = e.current;
        t && t.value !== y.current && ((t.value = y.current), Ll(t, c.current));
      }, [b]);
    const D = C.identity
      ? `${C.identity.predictionEdition}:${C.identity.questionId}`
      : ``;
    (0, O.useEffect)(() => {
      if (!b || C.phase !== `ANSWERING` || C.audioStatus !== `EMPTY` || !D) {
        C.audioStatus !== `EMPTY` && ie(null);
        return;
      }
      se.current !== D &&
        ((se.current = D), (ce.current = performance.now() + 3e3), ie(3));
    }, [b, C.phase, C.audioStatus, D]);
    const ge = re !== null;
    if (
      ((0, O.useEffect)(() => {
        if (!ge || !b) return;
        const e = setInterval(() => {
          const e = Math.ceil((ce.current - performance.now()) / 1e3);
          if (e <= 0) {
            ie(null), u.current?.autoPlayAudio();
            return;
          }
          ie((t) => (t === null ? null : e));
        }, 200);
        return () => clearInterval(e);
      }, [ge, b]),
      (0, O.useEffect)(() => {
        if ((s.current && (s.current.textContent = `00:00`), !D)) return;
        const e = performance.now(),
          t = setInterval(() => {
            const t = s.current;
            if (!t) return;
            const n = Math.floor((performance.now() - e) / 1e3);
            t.textContent = `${String(Math.floor(n / 60)).padStart(2, `0`)}:${String(n % 60).padStart(2, `0`)}`;
          }, 1e3);
        return () => clearInterval(t);
      }, [D]),
      (0, O.useEffect)(() => {
        if (!b) return;
        const e = () => {
          const e = u.current?.audioSnapshot() ?? null,
            i = t.current,
            a = n.current,
            o = r.current;
          if ((i && (i.dataset.live = e ? `true` : `false`), !(!a || !o)))
            if (e && e.duration > 0) {
              const t = Math.min(100, (e.currentTime / e.duration) * 100);
              (a.style.width = `${t.toFixed(1)}%`),
                (o.textContent = `${Rl(e.currentTime)} / ${Rl(e.duration)}`);
            } else (a.style.width = ``), (o.textContent = ``);
        };
        if ((e(), C.audioStatus !== `PLAYING` && C.audioStatus !== `BUFFERING`))
          return;
        const i = setInterval(e, 100);
        return () => clearInterval(i);
      }, [C.audioStatus, b]),
      (0, O.useEffect)(() => {
        b &&
          (C.phase === `ANSWERING` && e.current?.focus({ preventScroll: !0 }),
          C.phase === `REVIEW` && i.current?.focus({ preventScroll: !0 }),
          C.phase === `COMMAND` && a.current?.focus({ preventScroll: !0 }),
          Nl(C.phase, C.indexStatus) &&
            o.current?.focus({ preventScroll: !0 }));
      }, [C.phase, C.indexStatus, b]),
      (0, O.useEffect)(() => {
        if (!b || C.phase !== `COMMAND` || ee !== `none` || S) return;
        const e = f.current.current,
          t = setTimeout(() => {
            const t = f.current;
            t.isCurrent(e) &&
              !t.busy &&
              p.current === `none` &&
              u.current?.state.phase === `COMMAND` &&
              T();
          }, 1500);
        return () => clearTimeout(t);
      }, [T, S, b, ee, C.phase]),
      (0, O.useEffect)(() => {
        const e = l.current;
        if (e)
          return (
            b ? d.current.enable(e) : d.current.disable(),
            () => d.current.disable()
          );
      }, [b]),
      (0, O.useEffect)(() => {
        const e = (e) => {
            const t = Ee(e, {
              phase: C.phase,
              overlayOpen: b,
              nowMs: performance.now(),
              reviewReadyAtMs: g.current,
              enterReleased: _.current,
              keymap: C.keymap,
              editingCommandField: Fl(e),
              indexStatus: C.indexStatus,
            });
            t.consume && (e.preventDefault(), e.stopImmediatePropagation()),
              t.action ? n(t.action) : b && l.current && Re(e, l.current);
          },
          t = (e) => {
            e.key === `Enter` && (_.current = !0);
          };
        return (
          document.addEventListener(`keydown`, e, !0),
          document.addEventListener(`keyup`, t, !0),
          () => {
            document.removeEventListener(`keydown`, e, !0),
              document.removeEventListener(`keyup`, t, !0);
          }
        );
        async function n(e) {
          const t = u.current;
          if (e === `toggle-overlay`) {
            de();
            return;
          }
          if (t) {
            if (t.state.phase === `COMMAND`) {
              await pe(e, f.current.current);
              return;
            }
            e === `submit`
              ? ((_.current = !1), await t.submit())
              : e === `play`
                ? (ie(null), await t.play())
                : e === `restart`
                  ? (ie(null), await t.restartAudio())
                  : e === `next`
                    ? await t.navigate(`next`)
                    : e === `previous`
                      ? await t.navigate(`previous`)
                      : e === `mark`
                        ? await t.toggleMarked()
                        : e === `open-command`
                          ? E()
                          : e === `close-command`
                            ? T()
                            : e === `redo`
                              ? (await t.redo(), fe())
                              : e === `help`
                                ? w(`help`)
                                : e === `retry`
                                  ? (w(`none`), await t.initialize())
                                  : e === `original-site`
                                    ? (w(`none`), de(!1))
                                    : e === `pause-index`
                                      ? t.pauseIndex()
                                      : e === `resume-index`
                                        ? t.resumeIndex()
                                        : e === `cancel-index` &&
                                          t.cancelIndex();
          }
        }
      }, [fe, T, b, E, pe, w, C.keymap, C.indexStatus, C.phase, de]),
      !b)
    )
      return null;
    const _e = C.identity,
      ve = C.review,
      ye = ve
        ? ve.totalWords > 0
          ? Math.round((ve.correctCount / ve.totalWords) * 100)
          : 100
        : 0,
      be = C.phase === `ANSWERING`,
      xe = f.current.current;
    return (0, G.jsxs)(`main`, {
      className: `cockpit cockpit--${C.mode}`,
      ref: l,
      "data-testid": `pte-pilot-root`,
      "data-phase": C.phase,
      "aria-label": `PTE Pilot WFD 练习舱`,
      children: [
        (0, G.jsxs)(`header`, {
          className: `exam-header`,
          children: [
            (0, G.jsxs)(`div`, {
              className: `exam-header__title`,
              children: [
                (0, G.jsx)(`strong`, { children: `PTE Academic` }),
                (0, G.jsx)(`span`, {
                  children: `Listening · Write From Dictation`,
                }),
              ],
            }),
            (0, G.jsxs)(`div`, {
              className: `exam-header__meta`,
              children: [
                (0, G.jsxs)(`span`, {
                  className: `exam-timer`,
                  role: `timer`,
                  "aria-label": `本题用时`,
                  children: [
                    (0, G.jsx)(`i`, { "aria-hidden": `true` }),
                    (0, G.jsx)(`span`, { ref: s, children: `00:00` }),
                  ],
                }),
                (0, G.jsx)(`span`, {
                  className: `exam-counter`,
                  "data-testid": `question-position`,
                  children: _e ? `${_e.position}/${_e.total}` : `—`,
                }),
                (0, G.jsx)(`span`, {
                  className: `exam-qid`,
                  "data-testid": `question-id`,
                  children: _e ? `#${_e.questionId}` : ``,
                }),
                (0, G.jsxs)(`button`, {
                  className: `quiet-button`,
                  type: `button`,
                  onClick: () => de(!1),
                  "aria-label": `返回萤火虫原网页`,
                  children: [
                    (0, G.jsx)(`kbd`, { children: `Alt Shift P` }),
                    ` 关闭`,
                  ],
                }),
              ],
            }),
          ],
        }),
        (0, G.jsxs)(`section`, {
          className: `practice-deck${C.review ? ` practice-deck--review` : ``}`,
          children: [
            (0, G.jsx)(`p`, {
              className: `instructions`,
              children: `You will hear a sentence. Type the sentence in the box below exactly as you hear it. Write as much of the sentence as you can. You will hear the sentence only once.`,
            }),
            _e &&
              !W(_e.predictionEdition) &&
              !ae &&
              Ml(C.phase) &&
              (0, G.jsxs)(`aside`, {
                className: `onboard`,
                "data-testid": `onboarding`,
                children: [
                  (0, G.jsxs)(`div`, {
                    className: `onboard__text`,
                    children: [
                      (0, G.jsx)(`strong`, { children: `第一步：建立索引` }),
                      (0, G.jsxs)(`span`, {
                        children: [
                          `建立后自动记录错题与错词，解锁本地复习、间隔重复和打字训练。 当前页共 `,
                          _e.total,
                          ` 题`,
                          _e.total > 300
                            ? `——题量较大，建议先在萤火虫切到周预测页再建。`
                            : `，一次建好长期使用。`,
                        ],
                      }),
                    ],
                  }),
                  (0, G.jsx)(`button`, {
                    type: `button`,
                    className: `onboard__go`,
                    onClick: () => void u.current?.buildFullIndex(),
                    children: `一键建立索引`,
                  }),
                  (0, G.jsx)(`button`, {
                    type: `button`,
                    className: `onboard__later`,
                    onClick: () => oe(!0),
                    children: `稍后`,
                  }),
                ],
              }),
            (0, G.jsxs)(`div`, {
              className: `audio-box`,
              "data-audio": C.audioStatus,
              ref: t,
              children: [
                (0, G.jsxs)(`div`, {
                  className: `audio-box__row`,
                  children: [
                    (0, G.jsx)(`strong`, {
                      "data-testid": `audio-status`,
                      children: K(C.audioStatus, C.mode, re),
                    }),
                    (0, G.jsx)(`span`, { className: `audio-time`, ref: r }),
                    (0, G.jsxs)(`span`, {
                      className: `key-hints`,
                      "aria-hidden": `true`,
                      children: [
                        (0, G.jsxs)(`kbd`, {
                          children: [`Alt `, C.keymap.restart?.toUpperCase()],
                        }),
                        ` 从头重播`,
                      ],
                    }),
                  ],
                }),
                (0, G.jsx)(`div`, {
                  className: `audio-track`,
                  "aria-hidden": `true`,
                  children: (0, G.jsx)(`i`, {
                    className: `audio-fill`,
                    ref: n,
                  }),
                }),
              ],
            }),
            (0, G.jsxs)(`label`, {
              className: `answer-shell`,
              children: [
                (0, G.jsx)(`span`, {
                  className: `sr-only`,
                  children: `输入听到的完整句子`,
                }),
                (0, G.jsx)(`textarea`, {
                  ref: e,
                  "data-testid": `answer-input`,
                  defaultValue: ``,
                  readOnly: !be,
                  "aria-readonly": !be,
                  spellCheck: !1,
                  autoCapitalize: `off`,
                  autoComplete: `off`,
                  autoCorrect: `off`,
                  placeholder:
                    C.mode === `exam`
                      ? ``
                      : `听完即写。Enter 提交，Esc 打开命令层。`,
                  onInput: (e) => {
                    (y.current = e.currentTarget.value),
                      Ll(e.currentTarget, c.current),
                      h.current && clearTimeout(h.current),
                      (h.current = setTimeout(
                        () => void u.current?.flushDraft(),
                        120,
                      ));
                  },
                  onBlur: () => void u.current?.flushDraft(),
                }),
                (0, G.jsxs)(`span`, {
                  className: `answer-foot`,
                  children: [
                    (0, G.jsx)(`output`, {
                      ref: c,
                      children: `Total Word Count: 0`,
                    }),
                    (0, G.jsxs)(`span`, {
                      children: [
                        (0, G.jsx)(`kbd`, { children: `Enter` }),
                        ` 提交`,
                      ],
                    }),
                  ],
                }),
              ],
            }),
            ve &&
              (0, G.jsxs)(`section`, {
                className: `review`,
                ref: i,
                tabIndex: C.phase === `REVIEW` ? 0 : -1,
                "data-testid": `review-result`,
                "aria-live": `polite`,
                children: [
                  (0, G.jsxs)(`header`, {
                    className: `review__head`,
                    children: [
                      (0, G.jsx)(`strong`, {
                        className: `review__title`,
                        children: `AI 评分`,
                      }),
                      (0, G.jsxs)(`span`, {
                        className: `review__legend`,
                        "aria-hidden": `true`,
                        children: [
                          (0, G.jsx)(`span`, {
                            className: `w-ok`,
                            children: `Correct`,
                          }),
                          (0, G.jsx)(`del`, {
                            className: `w-err`,
                            children: `Error`,
                          }),
                          (0, G.jsx)(`em`, {
                            className: `w-omit`,
                            children: `(Omit)`,
                          }),
                        ],
                      }),
                      (0, G.jsxs)(`span`, {
                        className: `review__pill`,
                        "data-testid": `review-score`,
                        children: [ve.correctCount, `/`, ve.totalWords],
                      }),
                    ],
                  }),
                  (0, G.jsx)(`div`, {
                    className: `score-bar`,
                    "aria-hidden": `true`,
                    children: (0, G.jsx)(`i`, { style: { width: `${ye}%` } }),
                  }),
                  (0, G.jsx)(`p`, {
                    className: `score-line`,
                    "data-testid": `score-line`,
                    children: Il(ve.segments).map(({ segment: e, id: t }) =>
                      e.kind === `correct`
                        ? (0, G.jsxs)(
                            `span`,
                            { className: `w-ok`, children: [e.text, ` `] },
                            t,
                          )
                        : e.kind === `omit`
                          ? (0, G.jsxs)(
                              `em`,
                              {
                                className: `w-omit`,
                                children: [`(`, e.text, `)`, ` `],
                              },
                              t,
                            )
                          : (0, G.jsxs)(
                              `del`,
                              { className: `w-err`, children: [e.text, ` `] },
                              t,
                            ),
                    ),
                  }),
                  (0, G.jsx)(`p`, {
                    className: `review__answer`,
                    "data-testid": `review-answer`,
                    children: ve.answerText,
                  }),
                  ve.translation &&
                    (0, G.jsx)(`p`, {
                      className: `review__translation`,
                      "data-testid": `review-translation`,
                      children: ve.translation,
                    }),
                  (0, G.jsxs)(`p`, {
                    className: `review__next`,
                    children: [
                      (0, G.jsx)(`kbd`, { children: `Enter` }),
                      ` 下一题 · `,
                      (0, G.jsx)(`kbd`, { children: `T` }),
                      ` 重做 · `,
                      (0, G.jsx)(`kbd`, { children: `K` }),
                      ` 上一题 · `,
                      (0, G.jsx)(`kbd`, { children: `R` }),
                      ` 重播`,
                    ],
                  }),
                ],
              }),
          ],
        }),
        (0, G.jsxs)(`footer`, {
          className: `exam-footer`,
          children: [
            (0, G.jsxs)(`div`, {
              className: `status-cluster`,
              children: [
                (0, G.jsxs)(`span`, {
                  ref: o,
                  "data-testid": `practice-state`,
                  role: `status`,
                  "aria-live": `polite`,
                  tabIndex: Nl(C.phase, C.indexStatus) ? 0 : -1,
                  children: [(0, G.jsx)(`i`, {}), C.phase],
                }),
                (0, G.jsx)(`span`, {
                  "data-testid": `site-status`,
                  children: C.siteStatus,
                }),
                C.indexStatus !== `IDLE` &&
                  (0, G.jsxs)(`span`, {
                    "data-testid": `index-status`,
                    children: [`索引 `, C.indexStatus],
                  }),
                C.reviewQueue &&
                  (0, G.jsxs)(`span`, {
                    className: `queue-chip`,
                    "data-testid": `review-queue`,
                    children: [
                      `错题循环 `,
                      C.reviewQueue.position,
                      `/`,
                      C.reviewQueue.total,
                    ],
                  }),
                (0, G.jsx)(`span`, {
                  "data-testid": `practice-notice`,
                  "aria-live": `polite`,
                  children: C.notice,
                }),
              ],
            }),
            (0, G.jsxs)(`nav`, {
              className: `footer-menu`,
              "aria-label": `快捷操作`,
              children: [
                (0, G.jsxs)(`button`, {
                  type: `button`,
                  className: `fbtn`,
                  disabled: !Ml(C.phase),
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: () => {
                    C.phase === `COMMAND` ? T() : E();
                  },
                  children: [`菜单 `, (0, G.jsx)(`kbd`, { children: `Esc` })],
                }),
                (0, G.jsxs)(`button`, {
                  type: `button`,
                  className: `fbtn`,
                  disabled: !Ml(C.phase) || !_e,
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: () => {
                    ie(null), u.current?.play();
                  },
                  children: [
                    `播放 `,
                    (0, G.jsxs)(`kbd`, {
                      children: [`Alt `, C.keymap.play?.toUpperCase()],
                    }),
                  ],
                }),
                (0, G.jsxs)(`button`, {
                  type: `button`,
                  className: `fbtn`,
                  disabled: !Ml(C.phase) || !_e,
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: () => {
                    ie(null), u.current?.restartAudio();
                  },
                  children: [
                    `重播 `,
                    (0, G.jsxs)(`kbd`, {
                      children: [`Alt `, C.keymap.restart?.toUpperCase()],
                    }),
                  ],
                }),
                (0, G.jsxs)(`button`, {
                  type: `button`,
                  className: `fbtn`,
                  disabled: !Ml(C.phase) || !_e,
                  onMouseDown: (e) => e.preventDefault(),
                  onClick: () => void u.current?.toggleMarked(),
                  children: [
                    C.marked ? `已标记` : `标记`,
                    ` `,
                    (0, G.jsxs)(`kbd`, {
                      children: [`Alt `, C.keymap.mark?.toUpperCase()],
                    }),
                  ],
                }),
              ],
            }),
            (0, G.jsxs)(`div`, {
              className: `exam-footer__actions`,
              children: [
                (0, G.jsx)(`span`, {
                  className: `mode-chip mode-chip--${C.mode}`,
                  "data-testid": `practice-mode`,
                  children: C.mode === `practice` ? `Practice` : `Exam`,
                }),
                (0, G.jsx)(`button`, {
                  type: `button`,
                  className: `btn-next`,
                  disabled: C.phase !== `ANSWERING` && C.phase !== `REVIEW`,
                  onClick: () => {
                    const e = u.current;
                    e &&
                      (e.state.phase === `ANSWERING`
                        ? e.submit()
                        : e.state.phase === `REVIEW` && e.navigate(`next`));
                  },
                  children: `Next`,
                }),
              ],
            }),
          ],
        }),
        (C.indexStatus === `INDEXING` || C.indexStatus === `PAUSED`) &&
          (0, G.jsxs)(`section`, {
            className: `index-control`,
            "aria-live": `polite`,
            children: [
              (0, G.jsx)(`strong`, {
                children:
                  C.indexStatus === `PAUSED`
                    ? `索引已暂停`
                    : `正在建立完整索引`,
              }),
              (0, G.jsxs)(`span`, {
                children: [
                  C.indexStatus === `PAUSED` ? `Enter / R 继续` : `Esc 暂停`,
                  ` · `,
                  `X 取消`,
                ],
              }),
              C.indexStatus === `PAUSED`
                ? (0, G.jsx)(`button`, {
                    type: `button`,
                    onClick: () => u.current?.resumeIndex(),
                    children: `继续`,
                  })
                : (0, G.jsx)(`button`, {
                    type: `button`,
                    onClick: () => u.current?.pauseIndex(),
                    children: `暂停`,
                  }),
              (0, G.jsx)(`button`, {
                type: `button`,
                onClick: () => u.current?.cancelIndex(),
                children: `取消`,
              }),
            ],
          }),
        C.fault &&
          (0, G.jsxs)(`section`, {
            className: `recovery`,
            role: `alert`,
            children: [
              (0, G.jsx)(`strong`, { children: C.fault.code }),
              (0, G.jsx)(`p`, { children: C.fault.message }),
              (0, G.jsxs)(`button`, {
                type: `button`,
                "data-testid": `recovery-retry`,
                onClick: () => {
                  w(`none`), u.current?.initialize();
                },
                children: [(0, G.jsx)(`kbd`, { children: `R` }), ` 重试`],
              }),
              (0, G.jsxs)(`button`, {
                type: `button`,
                "data-testid": `recovery-original-site`,
                onClick: () => {
                  w(`none`), de(!1);
                },
                children: [(0, G.jsx)(`kbd`, { children: `O` }), ` 返回原网页`],
              }),
              (0, G.jsxs)(`button`, {
                type: `button`,
                "data-testid": `recovery-help`,
                onClick: () => w(`help`),
                children: [(0, G.jsx)(`kbd`, { children: `?` }), ` 诊断帮助`],
              }),
              C.fault.code === `DESYNC` &&
                (0, G.jsxs)(`p`, {
                  children: [
                    (0, G.jsxs)(`kbd`, {
                      children: [`Alt `, C.keymap.next?.toUpperCase()],
                    }),
                    ` 下一题 ·`,
                    ` `,
                    (0, G.jsxs)(`kbd`, {
                      children: [`Alt `, C.keymap.previous?.toUpperCase()],
                    }),
                    ` 上一题`,
                  ],
                }),
              ee === `help` &&
                (0, G.jsx)(`div`, {
                  className: `recovery__help`,
                  children: (0, G.jsx)(Al, { keymap: C.keymap }),
                }),
            ],
          }),
        C.phase === `COMMAND` &&
          (0, G.jsx)(Cl, {
            panel: ee,
            state: C,
            controller: u.current,
            busy: S,
            onAction: (e) => void pe(e, xe),
            onChoose: (e) => void me(e, xe),
            onStartWrong: (e) => void he(e, xe),
            onExitQueue: () => u.current?.exitWrongDrive(),
            commandRef: a,
          }),
      ],
    });
  }
  function Cl({
    panel: e,
    state: t,
    controller: n,
    busy: r,
    onAction: i,
    onChoose: a,
    onStartWrong: o,
    onExitQueue: s,
    commandRef: c,
  }) {
    return (0, G.jsxs)(`aside`, {
      className: `command-layer`,
      ref: c,
      tabIndex: -1,
      "data-testid": `command-layer`,
      "aria-label": `命令层`,
      "aria-busy": r,
      children: [
        (0, G.jsxs)(`nav`, {
          className: `command-menu`,
          children: [
            (0, G.jsxs)(`button`, {
              type: `button`,
              disabled: r,
              onClick: () => i(`toggle-mode`),
              children: [(0, G.jsx)(`kbd`, { children: `E` }), ` 切换模式`],
            }),
            (0, G.jsxs)(`button`, {
              type: `button`,
              disabled: r,
              onClick: () => i(`ranked-review`),
              children: [(0, G.jsx)(`kbd`, { children: `Q` }), ` 错题集`],
            }),
            (0, G.jsxs)(`button`, {
              type: `button`,
              disabled: r,
              onClick: () => i(`word-library`),
              children: [(0, G.jsx)(`kbd`, { children: `W` }), ` 错词库`],
            }),
            (0, G.jsxs)(`button`, {
              type: `button`,
              disabled: r,
              onClick: () => i(`settings`),
              children: [(0, G.jsx)(`kbd`, { children: `S` }), ` 设置`],
            }),
            (0, G.jsxs)(`button`, {
              type: `button`,
              disabled: r,
              onClick: () => i(`build-index`),
              children: [(0, G.jsx)(`kbd`, { children: `B` }), ` 建立完整索引`],
            }),
            (0, G.jsxs)(`button`, {
              type: `button`,
              disabled: r,
              onClick: () => i(`help`),
              children: [(0, G.jsx)(`kbd`, { children: `?` }), ` 键位`],
            }),
          ],
        }),
        (0, G.jsxs)(`div`, {
          className: `command-panel`,
          children: [
            e === `none` &&
              (0, G.jsxs)(`p`, {
                children: [
                  `按单键执行命令；按 `,
                  (0, G.jsx)(`kbd`, { children: `I` }),
                  ` 或 `,
                  (0, G.jsx)(`kbd`, { children: `Esc` }),
                  ` 回到输入。`,
                ],
              }),
            e === `words` && (0, G.jsx)(wl, { words: t.words }),
            e === `settings` &&
              n &&
              (0, G.jsx)(kl, { controller: n, state: t }),
            e === `ranked` &&
              (0, G.jsx)(Ol, {
                entries: t.rankedEntries,
                current: t.identity?.questionId,
                queueActive: t.reviewQueue !== null,
                onChoose: a,
                onStartWrong: o,
                onExitQueue: s,
              }),
            e === `help` && (0, G.jsx)(Al, { keymap: t.keymap }),
          ],
        }),
      ],
    });
  }
  function wl({ words: e }) {
    const [t, n] = (0, O.useState)(
        () => new Set(e.slice(0, 10).map((e) => e.key)),
      ),
      [r, i] = (0, O.useState)(null),
      [a, o] = (0, O.useState)(0),
      s = e.filter((e) => t.has(e.key)).length,
      c = (e) => {
        n((t) => {
          const n = new Set(t);
          return n.has(e) ? n.delete(e) : n.add(e), n;
        });
      },
      l = () => {
        const n = e
          .filter((e) => t.has(e.key) && e.expected)
          .map((e) => ({ key: e.key, expected: e.expected }));
        n.length !== 0 && (o(0), i(be(n)));
      };
    if (r?.completed) {
      const e = r.results.filter((e) => !e.skipped && e.errors === 0).length;
      return (0, G.jsxs)(`section`, {
        "data-testid": `word-library`,
        children: [
          (0, G.jsx)(`h2`, { children: `训练完成` }),
          (0, G.jsxs)(`p`, {
            "data-testid": `drill-summary`,
            children: [
              r.results.length,
              ` 词 · 全对 `,
              e,
              ` · 错键 `,
              r.totalErrors,
            ],
          }),
          (0, G.jsxs)(`div`, {
            className: `drill-actions`,
            children: [
              (0, G.jsx)(`button`, {
                type: `button`,
                autoFocus: !0,
                onClick: () => {
                  o(0), i(be(r.words));
                },
                children: `再来一轮`,
              }),
              (0, G.jsx)(`button`, {
                type: `button`,
                onClick: () => i(null),
                children: `返回错词列表`,
              }),
            ],
          }),
        ],
      });
    }
    if (r) {
      const e = r.words[r.index];
      return (0, G.jsxs)(`section`, {
        "data-testid": `word-library`,
        "data-drill-stage": `typing`,
        children: [
          (0, G.jsx)(`h2`, { children: `打字训练` }),
          (0, G.jsxs)(`p`, {
            className: `drill-meta`,
            children: [
              r.index + 1,
              `/`,
              r.words.length,
              ` · 错键 `,
              r.totalErrors,
              ` · 输入正确自动下一词 · `,
              (0, G.jsx)(`kbd`, { children: `Enter` }),
              ` 跳过 · `,
              (0, G.jsx)(`kbd`, { children: `Esc` }),
              ` 退出`,
            ],
          }),
          (0, G.jsx)(
            `p`,
            {
              className: `drill-word${a > 0 ? ` drill-word--shake` : ``}`,
              "data-testid": `word-drill`,
              children: Tl(e?.expected ?? ``).map(({ char: e, id: t }, n) =>
                (0, G.jsx)(
                  `span`,
                  {
                    className:
                      n < r.typed.length
                        ? `drill-char drill-char--hit`
                        : `drill-char`,
                    children: e,
                  },
                  t,
                ),
              ),
            },
            `${r.index}:${a}`,
          ),
          (0, G.jsx)(`input`, {
            className: `drill-input`,
            value: r.typed,
            autoFocus: !0,
            spellCheck: !1,
            autoCapitalize: `off`,
            autoComplete: `off`,
            autoCorrect: `off`,
            "aria-label": `输入当前单词`,
            onChange: (e) => {
              const t = xe(r, e.currentTarget.value);
              i(t.state), t.rejected ? o((e) => e + 1) : t.advanced && o(0);
            },
            onKeyDown: (e) => {
              e.key === `Enter` && (e.preventDefault(), o(0), i(Se(r)));
            },
          }),
        ],
      });
    }
    return (0, G.jsxs)(`section`, {
      "data-testid": `word-library`,
      children: [
        (0, G.jsx)(`h2`, { children: `错词库` }),
        e.length === 0
          ? (0, G.jsx)(`p`, { children: `还没有错词。` })
          : (0, G.jsxs)(G.Fragment, {
              children: [
                (0, G.jsx)(`p`, {
                  className: `drill-hint`,
                  children: `勾选高频错词，刷题前先做一轮打字训练热手。`,
                }),
                (0, G.jsx)(`ol`, {
                  className: `word-pick`,
                  children: e.map((e) =>
                    (0, G.jsx)(
                      `li`,
                      {
                        children: (0, G.jsxs)(`label`, {
                          children: [
                            (0, G.jsx)(`input`, {
                              type: `checkbox`,
                              checked: t.has(e.key),
                              onChange: () => c(e.key),
                            }),
                            (0, G.jsx)(`strong`, {
                              children: e.expected || `∅`,
                            }),
                            (0, G.jsxs)(`span`, {
                              children: [
                                e.actual || `∅`,
                                ` · `,
                                e.type,
                                ` · `,
                                e.occurrences,
                              ],
                            }),
                          ],
                        }),
                      },
                      e.key,
                    ),
                  ),
                }),
                (0, G.jsxs)(`button`, {
                  type: `button`,
                  className: `drill-start`,
                  "data-testid": `drill-start`,
                  disabled: s === 0,
                  onClick: l,
                  children: [`开始打字训练（`, s, ` 词）`],
                }),
              ],
            }),
      ],
    });
  }
  function Tl(e) {
    const t = new Map();
    return [...e].map((e) => {
      const n = (t.get(e) ?? 0) + 1;
      return t.set(e, n), { char: e, id: `${e}:${n}` };
    });
  }
  var El = [
    { id: `all`, label: `全部` },
    { id: `wrong`, label: `只看错题` },
    { id: `due`, label: `到期` },
    { id: `new`, label: `未做` },
  ];
  function Dl(e, t) {
    return t === `wrong`
      ? e.wrong
      : t === `due`
        ? e.due
        : t !== `new` || !e.attempted;
  }
  function Ol({
    entries: e,
    current: t,
    queueActive: n,
    onChoose: r,
    onStartWrong: i,
    onExitQueue: a,
  }) {
    const [o, s] = (0, O.useState)(() =>
        e.some((e) => e.wrong) ? `wrong` : `all`,
      ),
      c = e.filter((e) => e.attempted).length,
      l = e.filter((e) => e.wrong),
      u = l.length,
      d = e.filter((e) => e.due).length,
      f = e.filter((e) => Dl(e, o));
    return (0, G.jsxs)(`section`, {
      "data-testid": `ranked-review`,
      children: [
        (0, G.jsx)(`h2`, { children: `错题集` }),
        (0, G.jsxs)(`p`, {
          className: `review-stats`,
          "data-testid": `review-stats`,
          children: [`已练 `, c, `/`, e.length, ` · 错题 `, u, ` · 到期 `, d],
        }),
        (0, G.jsxs)(`div`, {
          className: `drill-actions`,
          children: [
            (0, G.jsxs)(`button`, {
              type: `button`,
              className: `drill-start`,
              "data-testid": `wrong-drive-start`,
              disabled: u === 0,
              onClick: () => i(l.map((e) => e.questionId)),
              children: [`只刷错题（`, u, `）`],
            }),
            n &&
              (0, G.jsx)(`button`, {
                type: `button`,
                onClick: a,
                children: `退出错题循环`,
              }),
          ],
        }),
        (0, G.jsx)(`fieldset`, {
          className: `review-filters`,
          "aria-label": `复习筛选`,
          children: El.map(({ id: e, label: t }) =>
            (0, G.jsxs)(
              `button`,
              {
                type: `button`,
                className: `chip${o === e ? ` chip--on` : ``}`,
                "aria-pressed": o === e,
                onClick: () => s(e),
                children: [t, e === `wrong` ? `（${u}）` : ``],
              },
              e,
            ),
          ),
        }),
        f.length === 0
          ? (0, G.jsx)(`p`, {
              className: `review-empty`,
              children:
                o === `wrong` ? `没有错题——继续保持。` : `该筛选下暂无题目。`,
            })
          : (0, G.jsx)(`ol`, {
              className: `rank-list`,
              children: f.slice(0, 50).map((e, n) =>
                (0, G.jsx)(
                  `li`,
                  {
                    children: (0, G.jsxs)(`button`, {
                      type: `button`,
                      disabled: e.questionId === t,
                      onClick: () => r(e.questionId),
                      children: [
                        (0, G.jsxs)(`span`, { children: [`#`, n + 1] }),
                        e.questionId,
                        e.wrong
                          ? (0, G.jsx)(`em`, {
                              className: `tag tag--wrong`,
                              children: `错题`,
                            })
                          : null,
                        e.attempted
                          ? null
                          : (0, G.jsx)(`em`, {
                              className: `tag`,
                              children: `未做`,
                            }),
                        e.due && !e.wrong
                          ? (0, G.jsx)(`em`, {
                              className: `tag tag--due`,
                              children: `到期`,
                            })
                          : null,
                        e.marked
                          ? (0, G.jsx)(`em`, {
                              className: `tag tag--marked`,
                              children: `★`,
                            })
                          : null,
                        e.questionId === t ? ` · 当前` : ``,
                      ],
                    }),
                  },
                  e.questionId,
                ),
              ),
            }),
      ],
    });
  }
  function kl({ controller: e, state: t }) {
    const [n, r] = (0, O.useState)({ ...Te, ...t.keymap }),
      [i, a] = (0, O.useState)(``),
      o = Oe(n),
      s = Object.values(n).every((e) => /^[a-z]$/iu.test(e));
    return (0, G.jsxs)(`section`, {
      "data-testid": `settings-panel`,
      children: [
        (0, G.jsx)(`h2`, { children: `设置` }),
        (0, G.jsx)(`div`, {
          className: `settings-grid`,
          children: Object.keys(Te).map((e) =>
            (0, G.jsxs)(
              `label`,
              {
                children: [
                  `Alt + `,
                  Pl(e),
                  (0, G.jsx)(`input`, {
                    value: n[e],
                    maxLength: 1,
                    "aria-label": `${e} shortcut`,
                    onChange: (t) =>
                      r({ ...n, [e]: t.currentTarget.value.toLowerCase() }),
                  }),
                ],
              },
              e,
            ),
          ),
        }),
        (!s || o.length > 0) &&
          (0, G.jsx)(`p`, {
            className: `field-error`,
            children: `每项须为不同的单个字母。`,
          }),
        (0, G.jsx)(`button`, {
          type: `button`,
          disabled: !s || o.length > 0,
          onClick: async () => {
            a((await e.saveKeymap(n)) ? `快捷键已保存` : `快捷键冲突`);
          },
          children: `保存快捷键`,
        }),
        (0, G.jsx)(`p`, { "aria-live": `polite`, children: i }),
        (0, G.jsx)(`p`, { children: `快捷键只保存在本机浏览器中。` }),
      ],
    });
  }
  function Al({ keymap: e }) {
    return (0, G.jsxs)(`section`, {
      "data-testid": `help-panel`,
      children: [
        (0, G.jsx)(`h2`, { children: `全键盘` }),
        (0, G.jsxs)(`p`, {
          children: [
            (0, G.jsxs)(`kbd`, { children: [`Alt `, e.play?.toUpperCase()] }),
            ` 播放 ·`,
            ` `,
            (0, G.jsxs)(`kbd`, {
              children: [`Alt `, e.restart?.toUpperCase()],
            }),
            ` 重播 ·`,
            ` `,
            (0, G.jsxs)(`kbd`, {
              children: [
                `Alt `,
                e.next?.toUpperCase(),
                `/`,
                e.previous?.toUpperCase(),
              ],
            }),
            ` `,
            `切题 · `,
            (0, G.jsxs)(`kbd`, { children: [`Alt `, e.mark?.toUpperCase()] }),
            ` 标记`,
          ],
        }),
        (0, G.jsxs)(`p`, {
          children: [
            `结果页：`,
            (0, G.jsx)(`kbd`, { children: `Enter/J` }),
            ` 下一题 · `,
            (0, G.jsx)(`kbd`, { children: `K` }),
            ` 上一题 · `,
            (0, G.jsx)(`kbd`, { children: `T` }),
            ` `,
            `重做。全局 `,
            (0, G.jsx)(`kbd`, { children: `Alt Shift P` }),
            ` 显示/隐藏。`,
          ],
        }),
        (0, G.jsxs)(`p`, {
          children: [
            `命令层：`,
            (0, G.jsx)(`kbd`, { children: `B` }),
            ` 建立完整索引；索引中 `,
            (0, G.jsx)(`kbd`, { children: `Esc` }),
            ` 暂停、`,
            (0, G.jsx)(`kbd`, { children: `Enter/R` }),
            ` 继续、`,
            (0, G.jsx)(`kbd`, { children: `X` }),
            ` 取消。`,
          ],
        }),
      ],
    });
  }
  var jl = new Set([`ANSWERING`, `REVIEW`, `COMMAND`]);
  function Ml(e) {
    return jl.has(e);
  }
  function Nl(e, t) {
    return (
      e === `PROBING` ||
      e === `SUBMITTING` ||
      e === `NAVIGATING` ||
      e === `RESETTING` ||
      t === `DISCOVERING` ||
      t === `INDEXING` ||
      t === `PAUSED`
    );
  }
  function Pl(e) {
    return {
      play: `播放`,
      restart: `重播`,
      next: `下一题`,
      previous: `上一题`,
      mark: `标记`,
    }[e];
  }
  function Fl(e) {
    const t = e.composedPath()[0];
    return (
      t instanceof HTMLInputElement ||
      t instanceof HTMLTextAreaElement ||
      t instanceof HTMLSelectElement ||
      (t instanceof HTMLElement && t.isContentEditable)
    );
  }
  function Il(e) {
    const t = new Map();
    return e.map((e) => {
      const n = `${e.kind}:${e.text}`,
        r = (t.get(n) ?? 0) + 1;
      return t.set(n, r), { segment: e, id: `${n}:${r}` };
    });
  }
  function Ll(e, t) {
    if (!t) return;
    const n = `Total Word Count: ${e.value.trim() ? e.value.trim().split(/\s+/u).length : 0}`;
    t.value !== n && (t.value = n);
  }
  function Rl(e) {
    const t = Math.max(0, Math.floor(e));
    return `${String(Math.floor(t / 60)).padStart(2, `0`)}:${String(t % 60).padStart(2, `0`)}`;
  }
  function K(e, t, n) {
    const r =
      e === `EMPTY` && n !== null
        ? `Beginning in ${n}s`
        : e === `BUFFERING`
          ? `BUFFERING · 正在加载音频`
          : e;
    return t === `exam` ? `Status: ${r} · 单次播放` : `Status: ${r}`;
  }
  function q(e) {
    const t = e.searchParams.getAll(`pageSource`);
    return (
      e.origin === `https://www.fireflyau.com` &&
      e.pathname === `/ptehome/exercise` &&
      (t.length === 0 || (t.length === 1 && t[0] === `yc`))
    );
  }
  var J = ye({
      matches: [`https://www.fireflyau.com/ptehome/exercise*`],
      runAt: `document_idle`,
      cssInjectionMode: `ui`,
      async main(e) {
        if (!q(new URL(window.location.href))) return;
        const t = await _e(e, {
          name: `pte-pilot-cockpit`,
          position: `modal`,
          zIndex: 2147483647,
          isolateEvents: [`keydown`, `keyup`, `keypress`, `input`, `change`],
          onMount(e, t, n) {
            n.setAttribute(`data-pte-pilot-host`, ``);
            const r = (0, g.createRoot)(e);
            return r.render((0, G.jsx)(Sl, {})), r;
          },
          onRemove(e) {
            e?.unmount();
          },
        });
        t.mount(), e.onInvalidated(() => t.remove());
      },
    }),
    Y = class e extends Event {
      static EVENT_NAME = X(`wxt:locationchange`);
      constructor(t, n) {
        super(e.EVENT_NAME, {}), (this.newUrl = t), (this.oldUrl = n);
      }
    };
  function X(e) {
    return `${pe?.runtime?.id}:firefly:${e}`;
  }
  var zl = typeof globalThis.navigation?.addEventListener == `function`;
  function Bl(e) {
    let t,
      n = !1;
    return {
      run() {
        n ||
          ((n = !0),
          (t = new URL(location.href)),
          zl
            ? globalThis.navigation.addEventListener(
                `navigate`,
                (e) => {
                  const n = new URL(e.destination.url);
                  n.href !== t.href &&
                    (window.dispatchEvent(new Y(n, t)), (t = n));
                },
                { signal: e.signal },
              )
            : e.setInterval(() => {
                const e = new URL(location.href);
                e.href !== t.href &&
                  (window.dispatchEvent(new Y(e, t)), (t = e));
              }, 1e3));
      },
    };
  }
  var Vl = class e {
      static SCRIPT_STARTED_MESSAGE_TYPE = X(`wxt:content-script-started`);
      id;
      abortController;
      locationWatcher = Bl(this);
      constructor(e, t) {
        (this.contentScriptName = e),
          (this.options = t),
          (this.id = Math.random().toString(36).slice(2)),
          (this.abortController = new AbortController()),
          this.stopOldScripts(),
          this.listenForNewerScripts();
      }
      get signal() {
        return this.abortController.signal;
      }
      abort(e) {
        return this.abortController.abort(e);
      }
      get isInvalid() {
        return pe.runtime?.id ?? this.notifyInvalidated(), this.signal.aborted;
      }
      get isValid() {
        return !this.isInvalid;
      }
      onInvalidated(e) {
        return (
          this.signal.addEventListener(`abort`, e),
          () => this.signal.removeEventListener(`abort`, e)
        );
      }
      block() {
        return new Promise(() => {});
      }
      setInterval(e, t) {
        const n = setInterval(() => {
          this.isValid && e();
        }, t);
        return this.onInvalidated(() => clearInterval(n)), n;
      }
      setTimeout(e, t) {
        const n = setTimeout(() => {
          this.isValid && e();
        }, t);
        return this.onInvalidated(() => clearTimeout(n)), n;
      }
      requestAnimationFrame(e) {
        const t = requestAnimationFrame((...t) => {
          this.isValid && e(...t);
        });
        return this.onInvalidated(() => cancelAnimationFrame(t)), t;
      }
      requestIdleCallback(e, t) {
        const n = requestIdleCallback((...t) => {
          this.signal.aborted || e(...t);
        }, t);
        return this.onInvalidated(() => cancelIdleCallback(n)), n;
      }
      addEventListener(e, t, n, r) {
        t === `wxt:locationchange` &&
          this.isValid &&
          this.locationWatcher.run(),
          e.addEventListener?.(t.startsWith(`wxt:`) ? X(t) : t, n, {
            ...r,
            signal: this.signal,
          });
      }
      notifyInvalidated() {
        this.abort(`Content script context invalidated`),
          _.debug(
            `Content script "${this.contentScriptName}" context invalidated`,
          );
      }
      stopOldScripts() {
        document.dispatchEvent(
          new CustomEvent(e.SCRIPT_STARTED_MESSAGE_TYPE, {
            detail: {
              contentScriptName: this.contentScriptName,
              messageId: this.id,
            },
          }),
        ),
          this.options?.noScriptStartedPostMessage ||
            window.postMessage(
              {
                type: e.SCRIPT_STARTED_MESSAGE_TYPE,
                contentScriptName: this.contentScriptName,
                messageId: this.id,
              },
              `*`,
            );
      }
      verifyScriptStartedEvent(e) {
        const t = e.detail?.contentScriptName === this.contentScriptName,
          n = e.detail?.messageId === this.id;
        return t && !n;
      }
      listenForNewerScripts() {
        const t = (e) => {
          !(e instanceof CustomEvent) ||
            !this.verifyScriptStartedEvent(e) ||
            this.notifyInvalidated();
        };
        document.addEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE, t),
          this.onInvalidated(() =>
            document.removeEventListener(e.SCRIPT_STARTED_MESSAGE_TYPE, t),
          );
      }
    },
    Hl = {
      debug: (...e) => ([...e], void 0),
      log: (...e) => ([...e], void 0),
      warn: (...e) => ([...e], void 0),
      error: (...e) => ([...e], void 0),
    };
  return (async () => {
    try {
      const { main: e, ...t } = J;
      return await e(new Vl(`firefly`, t));
    } catch (e) {
      throw (
        (Hl.error(`The content script "firefly" crashed on startup!`, e), e)
      );
    }
  })();
})();
firefly;

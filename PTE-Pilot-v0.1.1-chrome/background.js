var background = (() => {
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
    l = globalThis.browser?.runtime?.id
      ? globalThis.browser
      : globalThis.chrome;
  function u(e) {
    return e == null || typeof e == `function` ? { main: e } : e;
  }
  var d;
  function f(e, t, n) {
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
  var p = class extends Error {
      constructor() {
        super(
          `Encountered Promise during synchronous parse. Use .parseAsync() instead.`,
        );
      }
    },
    m = class extends Error {
      constructor(e) {
        super(`Encountered unidirectional transform during encode: ${e}`),
          (this.name = `ZodEncodeError`);
      }
    };
  (d = globalThis).__zod_globalConfig ?? (d.__zod_globalConfig = {});
  var h = globalThis.__zod_globalConfig;
  function g(e) {
    return e && Object.assign(h, e), h;
  }
  function _(e) {
    const t = Object.values(e).filter((e) => typeof e == `number`);
    return Object.entries(e)
      .filter(([e, n]) => t.indexOf(+e) === -1)
      .map(([e, t]) => t);
  }
  function v(e, t) {
    return typeof t == `bigint` ? t.toString() : t;
  }
  function y(e) {
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
  function b(e) {
    return e == null;
  }
  function x(e) {
    const t = +!!e.startsWith(`^`),
      n = e.endsWith(`$`) ? e.length - 1 : e.length;
    return e.slice(t, n);
  }
  function ee(e, t) {
    const n = e / t,
      r = Math.round(n),
      i = 2 ** -52 * Math.max(Math.abs(n), 1);
    return Math.abs(n - r) < i ? 0 : n - r;
  }
  var S = Symbol(`evaluating`);
  function C(e, t, n) {
    let r;
    Object.defineProperty(e, t, {
      get() {
        if (r !== S) return r === void 0 && ((r = S), (r = n())), r;
      },
      set(n) {
        Object.defineProperty(e, t, { value: n });
      },
      configurable: !0,
    });
  }
  function w(e, t, n) {
    Object.defineProperty(e, t, {
      value: n,
      writable: !0,
      enumerable: !0,
      configurable: !0,
    });
  }
  function te(...e) {
    const t = {};
    for (const n of e) {
      const e = Object.getOwnPropertyDescriptors(n);
      Object.assign(t, e);
    }
    return Object.defineProperties({}, t);
  }
  function ne(e) {
    return JSON.stringify(e);
  }
  function re(e) {
    return e
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, ``)
      .replace(/[\s_-]+/g, `-`)
      .replace(/^-+|-+$/g, ``);
  }
  var ie =
    `captureStackTrace` in Error ? Error.captureStackTrace : (...e) => {};
  function ae(e) {
    return typeof e == `object` && !!e && !Array.isArray(e);
  }
  var oe = y(() => {
    if (
      h.jitless ||
      (typeof navigator < `u` && navigator?.userAgent?.includes(`Cloudflare`))
    )
      return !1;
    try {
      return Function(``), !0;
    } catch {
      return !1;
    }
  });
  function se(e) {
    if (ae(e) === !1) return !1;
    const t = e.constructor;
    if (t === void 0 || typeof t != `function`) return !0;
    const n = t.prototype;
    return !(ae(n) === !1 || Object.hasOwn(n, `isPrototypeOf`) === !1);
  }
  function ce(e) {
    return se(e)
      ? { ...e }
      : Array.isArray(e)
        ? [...e]
        : e instanceof Map
          ? new Map(e)
          : e instanceof Set
            ? new Set(e)
            : e;
  }
  var le = new Set([`string`, `number`, `symbol`]);
  function T(e) {
    return e.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
  }
  function ue(e, t, n) {
    const r = new e._zod.constr(t ?? e._zod.def);
    return (!t || n?.parent) && (r._zod.parent = e), r;
  }
  function E(e) {
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
  function de(e) {
    return Object.keys(e).filter(
      (t) => e[t]._zod.optin === `optional` && e[t]._zod.optout === `optional`,
    );
  }
  var fe = {
    safeint: [-(2 ** 53 - 1), 2 ** 53 - 1],
    int32: [-2147483648, 2147483647],
    uint32: [0, 4294967295],
    float32: [-34028234663852886e22, 34028234663852886e22],
    float64: [-Number.MAX_VALUE, Number.MAX_VALUE],
  };
  function pe(e, t) {
    const n = e._zod.def,
      r = n.checks;
    if (r && r.length > 0)
      throw Error(
        `.pick() cannot be used on object schemas containing refinements`,
      );
    return ue(
      e,
      te(e._zod.def, {
        get shape() {
          const e = {};
          for (const r in t) {
            if (!(r in n.shape)) throw Error(`Unrecognized key: "${r}"`);
            t[r] && (e[r] = n.shape[r]);
          }
          return w(this, `shape`, e), e;
        },
        checks: [],
      }),
    );
  }
  function me(e, t) {
    const n = e._zod.def,
      r = n.checks;
    if (r && r.length > 0)
      throw Error(
        `.omit() cannot be used on object schemas containing refinements`,
      );
    return ue(
      e,
      te(e._zod.def, {
        get shape() {
          const r = { ...e._zod.def.shape };
          for (const e in t) {
            if (!(e in n.shape)) throw Error(`Unrecognized key: "${e}"`);
            t[e] && delete r[e];
          }
          return w(this, `shape`, r), r;
        },
        checks: [],
      }),
    );
  }
  function he(e, t) {
    if (!se(t)) throw Error(`Invalid input to extend: expected a plain object`);
    const n = e._zod.def.checks;
    if (n && n.length > 0) {
      const n = e._zod.def.shape;
      for (const e in t)
        if (Object.getOwnPropertyDescriptor(n, e) !== void 0)
          throw Error(
            "Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.",
          );
    }
    return ue(
      e,
      te(e._zod.def, {
        get shape() {
          const n = { ...e._zod.def.shape, ...t };
          return w(this, `shape`, n), n;
        },
      }),
    );
  }
  function ge(e, t) {
    if (!se(t))
      throw Error(`Invalid input to safeExtend: expected a plain object`);
    return ue(
      e,
      te(e._zod.def, {
        get shape() {
          const n = { ...e._zod.def.shape, ...t };
          return w(this, `shape`, n), n;
        },
      }),
    );
  }
  function _e(e, t) {
    if (e._zod.def.checks?.length)
      throw Error(
        `.merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.`,
      );
    return ue(
      e,
      te(e._zod.def, {
        get shape() {
          const n = { ...e._zod.def.shape, ...t._zod.def.shape };
          return w(this, `shape`, n), n;
        },
        get catchall() {
          return t._zod.def.catchall;
        },
        checks: t._zod.def.checks ?? [],
      }),
    );
  }
  function D(e, t, n) {
    const r = t._zod.def.checks;
    if (r && r.length > 0)
      throw Error(
        `.partial() cannot be used on object schemas containing refinements`,
      );
    return ue(
      t,
      te(t._zod.def, {
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
          return w(this, `shape`, i), i;
        },
        checks: [],
      }),
    );
  }
  function ve(e, t, n) {
    return ue(
      t,
      te(t._zod.def, {
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
          return w(this, `shape`, i), i;
        },
      }),
    );
  }
  function O(e, t = 0) {
    if (e.aborted === !0) return !0;
    for (let n = t; n < e.issues.length; n++)
      if (e.issues[n]?.continue !== !0) return !0;
    return !1;
  }
  function ye(e, t = 0) {
    if (e.aborted === !0) return !0;
    for (let n = t; n < e.issues.length; n++)
      if (e.issues[n]?.continue === !1) return !0;
    return !1;
  }
  function be(e, t) {
    return t.map((t) => {
      var n;
      return (n = t).path ?? (n.path = []), t.path.unshift(e), t;
    });
  }
  function xe(e) {
    return typeof e == `string` ? e : e?.message;
  }
  function Se(e, t, n) {
    const r = e.message
        ? e.message
        : (xe(e.inst?._zod.def?.error?.(e)) ??
          xe(t?.error?.(e)) ??
          xe(n.customError?.(e)) ??
          xe(n.localeError?.(e)) ??
          `Invalid input`),
      { inst: i, continue: a, input: o, ...s } = e;
    return (s.path ??= []), (s.message = r), t?.reportInput && (s.input = o), s;
  }
  function Ce(e) {
    return Array.isArray(e)
      ? `array`
      : typeof e == `string`
        ? `string`
        : `unknown`;
  }
  function we(...e) {
    const [t, n, r] = e;
    return typeof t == `string`
      ? { message: t, code: `custom`, input: n, inst: r }
      : { ...t };
  }
  var Te = (e, t) => {
      (e.name = `$ZodError`),
        Object.defineProperty(e, "_zod", { value: e._zod, enumerable: !1 }),
        Object.defineProperty(e, "issues", { value: t, enumerable: !1 }),
        (e.message = JSON.stringify(t, v, 2)),
        Object.defineProperty(e, "toString", {
          value: () => e.message,
          enumerable: !1,
        });
    },
    Ee = f(`$ZodError`, Te),
    De = f(`$ZodError`, Te, { Parent: Error });
  function Oe(e, t = (e) => e.message) {
    const n = {},
      r = [];
    for (const i of e.issues)
      i.path.length > 0
        ? ((n[i.path[0]] = n[i.path[0]] || []), n[i.path[0]].push(t(i)))
        : r.push(t(i));
    return { formErrors: r, fieldErrors: n };
  }
  function ke(e, t = (e) => e.message) {
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
  var Ae = (e) => (t, n, r, i) => {
      const a = r ? { ...r, async: !1 } : { async: !1 },
        o = t._zod.run({ value: n, issues: [] }, a);
      if (o instanceof Promise) throw new p();
      if (o.issues.length) {
        const t = new (i?.Err ?? e)(o.issues.map((e) => Se(e, a, g())));
        throw (ie(t, i?.callee), t);
      }
      return o.value;
    },
    je = (e) => async (t, n, r, i) => {
      let a = r ? { ...r, async: !0 } : { async: !0 },
        o = t._zod.run({ value: n, issues: [] }, a);
      if ((o instanceof Promise && (o = await o), o.issues.length)) {
        const t = new (i?.Err ?? e)(o.issues.map((e) => Se(e, a, g())));
        throw (ie(t, i?.callee), t);
      }
      return o.value;
    },
    Me = (e) => (t, n, r) => {
      const i = r ? { ...r, async: !1 } : { async: !1 },
        a = t._zod.run({ value: n, issues: [] }, i);
      if (a instanceof Promise) throw new p();
      return a.issues.length
        ? {
            success: !1,
            error: new (e ?? Ee)(a.issues.map((e) => Se(e, i, g()))),
          }
        : { success: !0, data: a.value };
    },
    Ne = Me(De),
    Pe = (e) => async (t, n, r) => {
      let i = r ? { ...r, async: !0 } : { async: !0 },
        a = t._zod.run({ value: n, issues: [] }, i);
      return (
        a instanceof Promise && (a = await a),
        a.issues.length
          ? { success: !1, error: new e(a.issues.map((e) => Se(e, i, g()))) }
          : { success: !0, data: a.value }
      );
    },
    Fe = Pe(De),
    Ie = (e) => (t, n, r) => {
      const i = r ? { ...r, direction: `backward` } : { direction: `backward` };
      return Ae(e)(t, n, i);
    },
    Le = (e) => (t, n, r) => Ae(e)(t, n, r),
    Re = (e) => async (t, n, r) => {
      const i = r ? { ...r, direction: `backward` } : { direction: `backward` };
      return je(e)(t, n, i);
    },
    ze = (e) => async (t, n, r) => je(e)(t, n, r),
    Be = (e) => (t, n, r) => {
      const i = r ? { ...r, direction: `backward` } : { direction: `backward` };
      return Me(e)(t, n, i);
    },
    Ve = (e) => (t, n, r) => Me(e)(t, n, r),
    k = (e) => async (t, n, r) => {
      const i = r ? { ...r, direction: `backward` } : { direction: `backward` };
      return Pe(e)(t, n, i);
    },
    He = (e) => async (t, n, r) => Pe(e)(t, n, r),
    Ue = /^[cC][0-9a-z]{6,}$/,
    We = /^[0-9a-z]+$/,
    A = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/,
    Ge = /^[0-9a-vA-V]{20}$/,
    Ke = /^[A-Za-z0-9]{27}$/,
    qe = /^[a-zA-Z0-9_-]{21}$/,
    Je =
      /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/,
    Ye =
      /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/,
    Xe = (e) =>
      e
        ? RegExp(
            `^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${e}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`,
          )
        : /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/,
    Ze =
      /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/,
    Qe = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
  function $e() {
    return new RegExp(Qe, `u`);
  }
  var et =
      /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/,
    tt =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/,
    j =
      /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/,
    M =
      /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/,
    nt =
      /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/,
    rt = /^[A-Za-z0-9_-]*$/,
    it = /^https?$/,
    at = /^\+[1-9]\d{6,14}$/,
    ot = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`,
    st = RegExp(`^${ot}$`);
  function ct(e) {
    const t = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
    return typeof e.precision == `number`
      ? e.precision === -1
        ? `${t}`
        : e.precision === 0
          ? `${t}:[0-5]\\d`
          : `${t}:[0-5]\\d\\.\\d{${e.precision}}`
      : `${t}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  }
  function lt(e) {
    return RegExp(`^${ct(e)}$`);
  }
  function ut(e) {
    const t = ct({ precision: e.precision }),
      n = [`Z`];
    e.local && n.push(``),
      e.offset && n.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
    const r = `${t}(?:${n.join(`|`)})`;
    return RegExp(`^${ot}T(?:${r})$`);
  }
  var dt = (e) => {
      const t = e
        ? `[\\s\\S]{${e?.minimum ?? 0},${e?.maximum ?? ``}}`
        : `[\\s\\S]*`;
      return RegExp(`^${t}$`);
    },
    ft = /^-?\d+$/,
    pt = /^-?\d+(?:\.\d+)?$/,
    mt = /^(?:true|false)$/i,
    ht = /^null$/i,
    gt = /^[^A-Z]*$/,
    N = /^[^a-z]*$/,
    P = f(`$ZodCheck`, (e, t) => {
      var n;
      (e._zod ??= {}),
        (e._zod.def = t),
        (n = e._zod).onattach ?? (n.onattach = []);
    }),
    _t = { number: `number`, bigint: `bigint`, object: `date` },
    vt = f(`$ZodCheckLessThan`, (e, t) => {
      P.init(e, t);
      const n = _t[typeof t.value];
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
    yt = f(`$ZodCheckGreaterThan`, (e, t) => {
      P.init(e, t);
      const n = _t[typeof t.value];
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
    bt = f(`$ZodCheckMultipleOf`, (e, t) => {
      P.init(e, t),
        e._zod.onattach.push((e) => {
          var n;
          (n = e._zod.bag).multipleOf ?? (n.multipleOf = t.value);
        }),
        (e._zod.check = (n) => {
          if (typeof n.value != typeof t.value)
            throw Error(`Cannot mix number and bigint in multiple_of check.`);
          (typeof n.value == `bigint`
            ? n.value % t.value === BigInt(0)
            : ee(n.value, t.value) === 0) ||
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
    xt = f(`$ZodCheckNumberFormat`, (e, t) => {
      P.init(e, t), (t.format = t.format || `float64`);
      const n = t.format?.includes(`int`),
        r = n ? `int` : `number`,
        [i, a] = fe[t.format];
      e._zod.onattach.push((e) => {
        const r = e._zod.bag;
        (r.format = t.format),
          (r.minimum = i),
          (r.maximum = a),
          n && (r.pattern = ft);
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
    St = f(`$ZodCheckMaxLength`, (e, t) => {
      var n;
      P.init(e, t),
        (n = e._zod.def).when ??
          (n.when = (e) => {
            const t = e.value;
            return !b(t) && t.length !== void 0;
          }),
        e._zod.onattach.push((e) => {
          const n = e._zod.bag.maximum ?? 1 / 0;
          t.maximum < n && (e._zod.bag.maximum = t.maximum);
        }),
        (e._zod.check = (n) => {
          const r = n.value;
          if (r.length <= t.maximum) return;
          const i = Ce(r);
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
    Ct = f(`$ZodCheckMinLength`, (e, t) => {
      var n;
      P.init(e, t),
        (n = e._zod.def).when ??
          (n.when = (e) => {
            const t = e.value;
            return !b(t) && t.length !== void 0;
          }),
        e._zod.onattach.push((e) => {
          const n = e._zod.bag.minimum ?? -1 / 0;
          t.minimum > n && (e._zod.bag.minimum = t.minimum);
        }),
        (e._zod.check = (n) => {
          const r = n.value;
          if (r.length >= t.minimum) return;
          const i = Ce(r);
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
    wt = f(`$ZodCheckLengthEquals`, (e, t) => {
      var n;
      P.init(e, t),
        (n = e._zod.def).when ??
          (n.when = (e) => {
            const t = e.value;
            return !b(t) && t.length !== void 0;
          }),
        e._zod.onattach.push((e) => {
          const n = e._zod.bag;
          (n.minimum = t.length), (n.maximum = t.length), (n.length = t.length);
        }),
        (e._zod.check = (n) => {
          const r = n.value,
            i = r.length;
          if (i === t.length) return;
          const a = Ce(r),
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
    Tt = f(`$ZodCheckStringFormat`, (e, t) => {
      var n, r;
      P.init(e, t),
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
    F = f(`$ZodCheckRegex`, (e, t) => {
      Tt.init(e, t),
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
    Et = f(`$ZodCheckLowerCase`, (e, t) => {
      (t.pattern ??= gt), Tt.init(e, t);
    }),
    Dt = f(`$ZodCheckUpperCase`, (e, t) => {
      (t.pattern ??= N), Tt.init(e, t);
    }),
    Ot = f(`$ZodCheckIncludes`, (e, t) => {
      P.init(e, t);
      const n = T(t.includes),
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
    kt = f(`$ZodCheckStartsWith`, (e, t) => {
      P.init(e, t);
      const n = RegExp(`^${T(t.prefix)}.*`);
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
    At = f(`$ZodCheckEndsWith`, (e, t) => {
      P.init(e, t);
      const n = RegExp(`.*${T(t.suffix)}$`);
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
    jt = f(`$ZodCheckOverwrite`, (e, t) => {
      P.init(e, t),
        (e._zod.check = (e) => {
          e.value = t.tx(e.value);
        });
    }),
    Mt = class {
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
    I = { major: 4, minor: 4, patch: 3 },
    L = f(`$ZodType`, (e, t) => {
      var n;
      (e ??= {}),
        (e._zod.def = t),
        (e._zod.bag = e._zod.bag || {}),
        (e._zod.version = I);
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
            let r = O(e),
              i;
            for (const a of t) {
              if (a._zod.def.when) {
                if (ye(e) || !a._zod.def.when(e)) continue;
              } else if (r) continue;
              const t = e.issues.length,
                o = a._zod.check(e);
              if (o instanceof Promise && n?.async === !1) throw new p();
              if (i || o instanceof Promise)
                i = (i ?? Promise.resolve()).then(async () => {
                  await o, e.issues.length !== t && (r ||= O(e, t));
                });
              else {
                if (e.issues.length === t) continue;
                r ||= O(e, t);
              }
            }
            return i ? i.then(() => e) : e;
          },
          n = (n, i, a) => {
            if (O(n)) return (n.aborted = !0), n;
            const o = t(i, r, a);
            if (o instanceof Promise) {
              if (a.async === !1) throw new p();
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
            if (a.async === !1) throw new p();
            return o.then((e) => t(e, r, a));
          }
          return t(o, r, a);
        };
      }
      C(e, `~standard`, () => ({
        validate: (t) => {
          try {
            const n = Ne(e, t);
            return n.success ? { value: n.data } : { issues: n.error?.issues };
          } catch {
            return Fe(e, t).then((e) =>
              e.success ? { value: e.data } : { issues: e.error?.issues },
            );
          }
        },
        vendor: `zod`,
        version: 1,
      }));
    }),
    Nt = f(`$ZodString`, (e, t) => {
      L.init(e, t),
        (e._zod.pattern =
          [...(e?._zod.bag?.patterns ?? [])].pop() ?? dt(e._zod.bag)),
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
    R = f(`$ZodStringFormat`, (e, t) => {
      Tt.init(e, t), Nt.init(e, t);
    }),
    Pt = f(`$ZodGUID`, (e, t) => {
      (t.pattern ??= Ye), R.init(e, t);
    }),
    Ft = f(`$ZodUUID`, (e, t) => {
      if (t.version) {
        const e = { v1: 1, v2: 2, v3: 3, v4: 4, v5: 5, v6: 6, v7: 7, v8: 8 }[
          t.version
        ];
        if (e === void 0) throw Error(`Invalid UUID version: "${t.version}"`);
        t.pattern ??= Xe(e);
      } else t.pattern ??= Xe();
      R.init(e, t);
    }),
    It = f(`$ZodEmail`, (e, t) => {
      (t.pattern ??= Ze), R.init(e, t);
    }),
    Lt = f(`$ZodURL`, (e, t) => {
      R.init(e, t),
        (e._zod.check = (n) => {
          try {
            const r = n.value.trim();
            if (
              !t.normalize &&
              t.protocol?.source === it.source &&
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
    Rt = f(`$ZodEmoji`, (e, t) => {
      (t.pattern ??= $e()), R.init(e, t);
    }),
    zt = f(`$ZodNanoID`, (e, t) => {
      (t.pattern ??= qe), R.init(e, t);
    }),
    Bt = f(`$ZodCUID`, (e, t) => {
      (t.pattern ??= Ue), R.init(e, t);
    }),
    z = f(`$ZodCUID2`, (e, t) => {
      (t.pattern ??= We), R.init(e, t);
    }),
    Vt = f(`$ZodULID`, (e, t) => {
      (t.pattern ??= A), R.init(e, t);
    }),
    Ht = f(`$ZodXID`, (e, t) => {
      (t.pattern ??= Ge), R.init(e, t);
    }),
    Ut = f(`$ZodKSUID`, (e, t) => {
      (t.pattern ??= Ke), R.init(e, t);
    }),
    B = f(`$ZodISODateTime`, (e, t) => {
      (t.pattern ??= ut(t)), R.init(e, t);
    }),
    Wt = f(`$ZodISODate`, (e, t) => {
      (t.pattern ??= st), R.init(e, t);
    }),
    Gt = f(`$ZodISOTime`, (e, t) => {
      (t.pattern ??= lt(t)), R.init(e, t);
    }),
    Kt = f(`$ZodISODuration`, (e, t) => {
      (t.pattern ??= Je), R.init(e, t);
    }),
    qt = f(`$ZodIPv4`, (e, t) => {
      (t.pattern ??= et), R.init(e, t), (e._zod.bag.format = `ipv4`);
    }),
    Jt = f(`$ZodIPv6`, (e, t) => {
      (t.pattern ??= tt),
        R.init(e, t),
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
    V = f(`$ZodCIDRv4`, (e, t) => {
      (t.pattern ??= j), R.init(e, t);
    }),
    Yt = f(`$ZodCIDRv6`, (e, t) => {
      (t.pattern ??= M),
        R.init(e, t),
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
  function Xt(e) {
    if (e === ``) return !0;
    if (/\s/.test(e) || e.length % 4 != 0) return !1;
    try {
      return atob(e), !0;
    } catch {
      return !1;
    }
  }
  var Zt = f(`$ZodBase64`, (e, t) => {
    (t.pattern ??= nt),
      R.init(e, t),
      (e._zod.bag.contentEncoding = `base64`),
      (e._zod.check = (n) => {
        Xt(n.value) ||
          n.issues.push({
            code: `invalid_format`,
            format: `base64`,
            input: n.value,
            inst: e,
            continue: !t.abort,
          });
      });
  });
  function Qt(e) {
    if (!rt.test(e)) return !1;
    const t = e.replace(/[-_]/g, (e) => (e === `-` ? `+` : `/`));
    return Xt(t.padEnd(Math.ceil(t.length / 4) * 4, `=`));
  }
  var $t = f(`$ZodBase64URL`, (e, t) => {
      (t.pattern ??= rt),
        R.init(e, t),
        (e._zod.bag.contentEncoding = `base64url`),
        (e._zod.check = (n) => {
          Qt(n.value) ||
            n.issues.push({
              code: `invalid_format`,
              format: `base64url`,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    en = f(`$ZodE164`, (e, t) => {
      (t.pattern ??= at), R.init(e, t);
    });
  function tn(e, t = null) {
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
  var nn = f(`$ZodJWT`, (e, t) => {
      R.init(e, t),
        (e._zod.check = (n) => {
          tn(n.value, t.alg) ||
            n.issues.push({
              code: `invalid_format`,
              format: `jwt`,
              input: n.value,
              inst: e,
              continue: !t.abort,
            });
        });
    }),
    rn = f(`$ZodNumber`, (e, t) => {
      L.init(e, t),
        (e._zod.pattern = e._zod.bag.pattern ?? pt),
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
    an = f(`$ZodNumberFormat`, (e, t) => {
      xt.init(e, t), rn.init(e, t);
    }),
    on = f(`$ZodBoolean`, (e, t) => {
      L.init(e, t),
        (e._zod.pattern = mt),
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
    sn = f(`$ZodNull`, (e, t) => {
      L.init(e, t),
        (e._zod.pattern = ht),
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
    cn = f(`$ZodUnknown`, (e, t) => {
      L.init(e, t), (e._zod.parse = (e) => e);
    }),
    ln = f(`$ZodNever`, (e, t) => {
      L.init(e, t),
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
  function un(e, t, n) {
    e.issues.length && t.issues.push(...be(n, e.issues)),
      (t.value[n] = e.value);
  }
  var dn = f(`$ZodArray`, (e, t) => {
    L.init(e, t),
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
            ? a.push(s.then((t) => un(t, n, e)))
            : un(s, n, e);
        }
        return a.length ? Promise.all(a).then(() => n) : n;
      });
  });
  function fn(e, t, n, r, i, a) {
    const o = n in r;
    if (e.issues.length) {
      if (i && a && !o) return;
      t.issues.push(...be(n, e.issues));
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
  function pn(e) {
    const t = Object.keys(e.shape);
    for (const n of t)
      if (!e.shape?.[n]?._zod?.traits?.has(`$ZodType`))
        throw Error(`Invalid element at key "${n}": expected a Zod schema`);
    const n = de(e.shape);
    return {
      ...e,
      keys: t,
      keySet: new Set(t),
      numKeys: t.length,
      optionalKeys: new Set(n),
    };
  }
  function mn(e, t, n, r, i, a) {
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
        ? e.push(a.then((e) => fn(e, n, i, t, u, d)))
        : fn(a, n, i, t, u, d);
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
  var hn = f(`$ZodObject`, (e, t) => {
      if ((L.init(e, t), !Object.getOwnPropertyDescriptor(t, `shape`)?.get)) {
        const e = t.shape;
        Object.defineProperty(t, "shape", {
          get: () => {
            const n = { ...e };
            return Object.defineProperty(t, "shape", { value: n }), n;
          },
        });
      }
      const n = y(() => pn(t));
      C(e._zod, `propValues`, () => {
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
      let r = ae,
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
            ? c.push(a.then((n) => fn(n, t, e, s, r, i)))
            : fn(a, t, e, s, r, i);
        }
        return i
          ? mn(c, s, t, o, n.value, e)
          : c.length
            ? Promise.all(c).then(() => t)
            : t;
      };
    }),
    gn = f(`$ZodObjectJIT`, (e, t) => {
      hn.init(e, t);
      let n = e._zod.parse,
        r = y(() => pn(t)),
        i = (e) => {
          const t = new Mt([`shape`, `payload`, `ctx`]),
            n = r.value,
            i = (e) => {
              const t = ne(e);
              return `shape[${t}]._zod.run({ value: input[${t}], issues: [] }, ctx)`;
            };
          t.write(`const input = payload.value;`);
          let a = Object.create(null),
            o = 0;
          for (const e of n.keys) a[e] = `key_${o++}`;
          t.write(`const newResult = {};`);
          for (const r of n.keys) {
            const n = a[r],
              o = ne(r),
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
        o = ae,
        s = !h.jitless,
        c = s && oe.value,
        l = t.catchall,
        u;
      e._zod.parse = (d, f) => {
        u ??= r.value;
        const p = d.value;
        return o(p)
          ? s && c && f?.async === !1 && f.jitless !== !0
            ? ((a ||= i(t.shape)), (d = a(d, f)), l ? mn([], p, d, f, u, e) : d)
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
  function _n(e, t, n, r) {
    for (const n of e) if (n.issues.length === 0) return (t.value = n.value), t;
    const i = e.filter((e) => !O(e));
    return i.length === 1
      ? ((t.value = i[0].value), i[0])
      : (t.issues.push({
          code: `invalid_union`,
          input: t.value,
          inst: n,
          errors: e.map((e) => e.issues.map((e) => Se(e, r, g()))),
        }),
        t);
  }
  var vn = f(`$ZodUnion`, (e, t) => {
      L.init(e, t),
        C(e._zod, `optin`, () =>
          t.options.some((e) => e._zod.optin === `optional`)
            ? `optional`
            : void 0,
        ),
        C(e._zod, `optout`, () =>
          t.options.some((e) => e._zod.optout === `optional`)
            ? `optional`
            : void 0,
        ),
        C(e._zod, `values`, () => {
          if (t.options.every((e) => e._zod.values))
            return new Set(t.options.flatMap((e) => Array.from(e._zod.values)));
        }),
        C(e._zod, `pattern`, () => {
          if (t.options.every((e) => e._zod.pattern)) {
            const e = t.options.map((e) => e._zod.pattern);
            return RegExp(`^(${e.map((e) => x(e.source)).join(`|`)})$`);
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
        return a ? Promise.all(o).then((t) => _n(t, r, e, i)) : _n(o, r, e, i);
      };
    }),
    yn = f(`$ZodDiscriminatedUnion`, (e, t) => {
      (t.inclusive = !1), vn.init(e, t);
      const n = e._zod.parse;
      C(e._zod, `propValues`, () => {
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
      const r = y(() => {
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
        if (!ae(o))
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
    bn = f(`$ZodIntersection`, (e, t) => {
      L.init(e, t),
        (e._zod.parse = (e, n) => {
          const r = e.value,
            i = t.left._zod.run({ value: r, issues: [] }, n),
            a = t.right._zod.run({ value: r, issues: [] }, n);
          return i instanceof Promise || a instanceof Promise
            ? Promise.all([i, a]).then(([t, n]) => Sn(e, t, n))
            : Sn(e, i, a);
        });
    });
  function xn(e, t) {
    if (e === t || (e instanceof Date && t instanceof Date && +e == +t))
      return { valid: !0, data: e };
    if (se(e) && se(t)) {
      const n = Object.keys(t),
        r = Object.keys(e).filter((e) => n.indexOf(e) !== -1),
        i = { ...e, ...t };
      for (const n of r) {
        const r = xn(e[n], t[n]);
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
          o = xn(i, a);
        if (!o.valid)
          return { valid: !1, mergeErrorPath: [r, ...o.mergeErrorPath] };
        n.push(o.data);
      }
      return { valid: !0, data: n };
    }
    return { valid: !1, mergeErrorPath: [] };
  }
  function Sn(e, t, n) {
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
    if ((a.length && i && e.issues.push({ ...i, keys: a }), O(e))) return e;
    const o = xn(t.value, n.value);
    if (!o.valid)
      throw Error(
        `Unmergable intersection. Error path: ${JSON.stringify(o.mergeErrorPath)}`,
      );
    return (e.value = o.data), e;
  }
  var Cn = f(`$ZodRecord`, (e, t) => {
      L.init(e, t),
        (e._zod.parse = (n, r) => {
          const i = n.value;
          if (!se(i))
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
                    issues: o.issues.map((e) => Se(e, r, g())),
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
                        e.issues.length && n.issues.push(...be(c, e.issues)),
                          (n.value[l] = e.value);
                      }),
                    )
                  : (u.issues.length && n.issues.push(...be(c, u.issues)),
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
              if (typeof o == `string` && pt.test(o) && s.issues.length) {
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
                      issues: s.issues.map((e) => Se(e, r, g())),
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
                      e.issues.length && n.issues.push(...be(o, e.issues)),
                        (n.value[s.value] = e.value);
                    }),
                  )
                : (c.issues.length && n.issues.push(...be(o, c.issues)),
                  (n.value[s.value] = c.value));
            }
          }
          return a.length ? Promise.all(a).then(() => n) : n;
        });
    }),
    wn = f(`$ZodEnum`, (e, t) => {
      L.init(e, t);
      const n = _(t.entries),
        r = new Set(n);
      (e._zod.values = r),
        (e._zod.pattern = RegExp(
          `^(${n
            .filter((e) => le.has(typeof e))
            .map((e) => (typeof e == `string` ? T(e) : e.toString()))
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
    Tn = f(`$ZodLiteral`, (e, t) => {
      if ((L.init(e, t), t.values.length === 0))
        throw Error(`Cannot create literal schema with no valid values`);
      const n = new Set(t.values);
      (e._zod.values = n),
        (e._zod.pattern = RegExp(
          `^(${t.values.map((e) => (typeof e == `string` ? T(e) : e ? T(e.toString()) : String(e))).join(`|`)})$`,
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
    En = f(`$ZodTransform`, (e, t) => {
      L.init(e, t),
        (e._zod.optin = `optional`),
        (e._zod.parse = (n, r) => {
          if (r.direction === `backward`) throw new m(e.constructor.name);
          const i = t.transform(n.value, n);
          if (r.async)
            return (i instanceof Promise ? i : Promise.resolve(i)).then(
              (e) => ((n.value = e), (n.fallback = !0), n),
            );
          if (i instanceof Promise) throw new p();
          return (n.value = i), (n.fallback = !0), n;
        });
    });
  function Dn(e, t) {
    return t === void 0 && (e.issues.length || e.fallback)
      ? { issues: [], value: void 0 }
      : e;
  }
  var On = f(`$ZodOptional`, (e, t) => {
      L.init(e, t),
        (e._zod.optin = `optional`),
        (e._zod.optout = `optional`),
        C(e._zod, `values`, () =>
          t.innerType._zod.values
            ? new Set([...t.innerType._zod.values, void 0])
            : void 0,
        ),
        C(e._zod, `pattern`, () => {
          const e = t.innerType._zod.pattern;
          return e ? RegExp(`^(${x(e.source)})?$`) : void 0;
        }),
        (e._zod.parse = (e, n) => {
          if (t.innerType._zod.optin === `optional`) {
            const r = e.value,
              i = t.innerType._zod.run(e, n);
            return i instanceof Promise ? i.then((e) => Dn(e, r)) : Dn(i, r);
          }
          return e.value === void 0 ? e : t.innerType._zod.run(e, n);
        });
    }),
    kn = f(`$ZodExactOptional`, (e, t) => {
      On.init(e, t),
        C(e._zod, `values`, () => t.innerType._zod.values),
        C(e._zod, `pattern`, () => t.innerType._zod.pattern),
        (e._zod.parse = (e, n) => t.innerType._zod.run(e, n));
    }),
    An = f(`$ZodNullable`, (e, t) => {
      L.init(e, t),
        C(e._zod, `optin`, () => t.innerType._zod.optin),
        C(e._zod, `optout`, () => t.innerType._zod.optout),
        C(e._zod, `pattern`, () => {
          const e = t.innerType._zod.pattern;
          return e ? RegExp(`^(${x(e.source)}|null)$`) : void 0;
        }),
        C(e._zod, `values`, () =>
          t.innerType._zod.values
            ? new Set([...t.innerType._zod.values, null])
            : void 0,
        ),
        (e._zod.parse = (e, n) =>
          e.value === null ? e : t.innerType._zod.run(e, n));
    }),
    jn = f(`$ZodDefault`, (e, t) => {
      L.init(e, t),
        (e._zod.optin = `optional`),
        C(e._zod, `values`, () => t.innerType._zod.values),
        (e._zod.parse = (e, n) => {
          if (n.direction === `backward`) return t.innerType._zod.run(e, n);
          if (e.value === void 0) return (e.value = t.defaultValue), e;
          const r = t.innerType._zod.run(e, n);
          return r instanceof Promise ? r.then((e) => Mn(e, t)) : Mn(r, t);
        });
    });
  function Mn(e, t) {
    return e.value === void 0 && (e.value = t.defaultValue), e;
  }
  var H = f(`$ZodPrefault`, (e, t) => {
      L.init(e, t),
        (e._zod.optin = `optional`),
        C(e._zod, `values`, () => t.innerType._zod.values),
        (e._zod.parse = (e, n) => (
          n.direction === `backward` ||
            (e.value === void 0 && (e.value = t.defaultValue)),
          t.innerType._zod.run(e, n)
        ));
    }),
    Nn = f(`$ZodNonOptional`, (e, t) => {
      L.init(e, t),
        C(e._zod, `values`, () => {
          const e = t.innerType._zod.values;
          return e ? new Set([...e].filter((e) => e !== void 0)) : void 0;
        }),
        (e._zod.parse = (n, r) => {
          const i = t.innerType._zod.run(n, r);
          return i instanceof Promise ? i.then((t) => Pn(t, e)) : Pn(i, e);
        });
    });
  function Pn(e, t) {
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
  var Fn = f(`$ZodCatch`, (e, t) => {
      L.init(e, t),
        (e._zod.optin = `optional`),
        C(e._zod, `optout`, () => t.innerType._zod.optout),
        C(e._zod, `values`, () => t.innerType._zod.values),
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
                      error: { issues: r.issues.map((e) => Se(e, n, g())) },
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
                  error: { issues: r.issues.map((e) => Se(e, n, g())) },
                  input: e.value,
                })),
                (e.issues = []),
                (e.fallback = !0)),
              e);
        });
    }),
    In = f(`$ZodPipe`, (e, t) => {
      L.init(e, t),
        C(e._zod, `values`, () => t.in._zod.values),
        C(e._zod, `optin`, () => t.in._zod.optin),
        C(e._zod, `optout`, () => t.out._zod.optout),
        C(e._zod, `propValues`, () => t.in._zod.propValues),
        (e._zod.parse = (e, n) => {
          if (n.direction === `backward`) {
            const r = t.out._zod.run(e, n);
            return r instanceof Promise
              ? r.then((e) => Ln(e, t.in, n))
              : Ln(r, t.in, n);
          }
          const r = t.in._zod.run(e, n);
          return r instanceof Promise
            ? r.then((e) => Ln(e, t.out, n))
            : Ln(r, t.out, n);
        });
    });
  function Ln(e, t, n) {
    return e.issues.length
      ? ((e.aborted = !0), e)
      : t._zod.run(
          { value: e.value, issues: e.issues, fallback: e.fallback },
          n,
        );
  }
  var Rn = f(`$ZodReadonly`, (e, t) => {
    L.init(e, t),
      C(e._zod, `propValues`, () => t.innerType._zod.propValues),
      C(e._zod, `values`, () => t.innerType._zod.values),
      C(e._zod, `optin`, () => t.innerType?._zod?.optin),
      C(e._zod, `optout`, () => t.innerType?._zod?.optout),
      (e._zod.parse = (e, n) => {
        if (n.direction === `backward`) return t.innerType._zod.run(e, n);
        const r = t.innerType._zod.run(e, n);
        return r instanceof Promise ? r.then(zn) : zn(r);
      });
  });
  function zn(e) {
    return (e.value = Object.freeze(e.value)), e;
  }
  var Bn = f(`$ZodCustom`, (e, t) => {
    P.init(e, t),
      L.init(e, t),
      (e._zod.parse = (e, t) => e),
      (e._zod.check = (n) => {
        const r = n.value,
          i = t.fn(r);
        if (i instanceof Promise) return i.then((t) => Vn(t, n, r, e));
        Vn(i, n, r, e);
      });
  });
  function Vn(e, t, n, r) {
    if (!e) {
      const e = {
        code: `custom`,
        input: n,
        inst: r,
        path: [...(r._zod.def.path ?? [])],
        continue: !r._zod.def.abort,
      };
      r._zod.def.params && (e.params = r._zod.def.params), t.issues.push(we(e));
    }
  }
  var Hn,
    Un = class {
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
  function Wn() {
    return new Un();
  }
  (Hn = globalThis).__zod_globalRegistry ?? (Hn.__zod_globalRegistry = Wn());
  var Gn = globalThis.__zod_globalRegistry;
  function Kn(e, t) {
    return new e({ type: `string`, ...E(t) });
  }
  function qn(e, t) {
    return new e({
      type: `string`,
      format: `email`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function Jn(e, t) {
    return new e({
      type: `string`,
      format: `guid`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function Yn(e, t) {
    return new e({
      type: `string`,
      format: `uuid`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function Xn(e, t) {
    return new e({
      type: `string`,
      format: `uuid`,
      check: `string_format`,
      abort: !1,
      version: `v4`,
      ...E(t),
    });
  }
  function Zn(e, t) {
    return new e({
      type: `string`,
      format: `uuid`,
      check: `string_format`,
      abort: !1,
      version: `v6`,
      ...E(t),
    });
  }
  function Qn(e, t) {
    return new e({
      type: `string`,
      format: `uuid`,
      check: `string_format`,
      abort: !1,
      version: `v7`,
      ...E(t),
    });
  }
  function $n(e, t) {
    return new e({
      type: `string`,
      format: `url`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function er(e, t) {
    return new e({
      type: `string`,
      format: `emoji`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function tr(e, t) {
    return new e({
      type: `string`,
      format: `nanoid`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function nr(e, t) {
    return new e({
      type: `string`,
      format: `cuid`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function rr(e, t) {
    return new e({
      type: `string`,
      format: `cuid2`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function ir(e, t) {
    return new e({
      type: `string`,
      format: `ulid`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function ar(e, t) {
    return new e({
      type: `string`,
      format: `xid`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function or(e, t) {
    return new e({
      type: `string`,
      format: `ksuid`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function sr(e, t) {
    return new e({
      type: `string`,
      format: `ipv4`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function cr(e, t) {
    return new e({
      type: `string`,
      format: `ipv6`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function lr(e, t) {
    return new e({
      type: `string`,
      format: `cidrv4`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function ur(e, t) {
    return new e({
      type: `string`,
      format: `cidrv6`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function dr(e, t) {
    return new e({
      type: `string`,
      format: `base64`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function fr(e, t) {
    return new e({
      type: `string`,
      format: `base64url`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function pr(e, t) {
    return new e({
      type: `string`,
      format: `e164`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function U(e, t) {
    return new e({
      type: `string`,
      format: `jwt`,
      check: `string_format`,
      abort: !1,
      ...E(t),
    });
  }
  function mr(e, t) {
    return new e({
      type: `string`,
      format: `datetime`,
      check: `string_format`,
      offset: !1,
      local: !1,
      precision: null,
      ...E(t),
    });
  }
  function hr(e, t) {
    return new e({
      type: `string`,
      format: `date`,
      check: `string_format`,
      ...E(t),
    });
  }
  function gr(e, t) {
    return new e({
      type: `string`,
      format: `time`,
      check: `string_format`,
      precision: null,
      ...E(t),
    });
  }
  function _r(e, t) {
    return new e({
      type: `string`,
      format: `duration`,
      check: `string_format`,
      ...E(t),
    });
  }
  function vr(e, t) {
    return new e({ type: `number`, checks: [], ...E(t) });
  }
  function yr(e, t) {
    return new e({
      type: `number`,
      check: `number_format`,
      abort: !1,
      format: `safeint`,
      ...E(t),
    });
  }
  function br(e, t) {
    return new e({ type: `boolean`, ...E(t) });
  }
  function xr(e, t) {
    return new e({ type: `null`, ...E(t) });
  }
  function Sr(e) {
    return new e({ type: `unknown` });
  }
  function Cr(e, t) {
    return new e({ type: `never`, ...E(t) });
  }
  function wr(e, t) {
    return new vt({ check: `less_than`, ...E(t), value: e, inclusive: !1 });
  }
  function Tr(e, t) {
    return new vt({ check: `less_than`, ...E(t), value: e, inclusive: !0 });
  }
  function Er(e, t) {
    return new yt({ check: `greater_than`, ...E(t), value: e, inclusive: !1 });
  }
  function Dr(e, t) {
    return new yt({ check: `greater_than`, ...E(t), value: e, inclusive: !0 });
  }
  function Or(e, t) {
    return new bt({ check: `multiple_of`, ...E(t), value: e });
  }
  function kr(e, t) {
    return new St({ check: `max_length`, ...E(t), maximum: e });
  }
  function Ar(e, t) {
    return new Ct({ check: `min_length`, ...E(t), minimum: e });
  }
  function jr(e, t) {
    return new wt({ check: `length_equals`, ...E(t), length: e });
  }
  function Mr(e, t) {
    return new F({
      check: `string_format`,
      format: `regex`,
      ...E(t),
      pattern: e,
    });
  }
  function Nr(e) {
    return new Et({ check: `string_format`, format: `lowercase`, ...E(e) });
  }
  function Pr(e) {
    return new Dt({ check: `string_format`, format: `uppercase`, ...E(e) });
  }
  function Fr(e, t) {
    return new Ot({
      check: `string_format`,
      format: `includes`,
      ...E(t),
      includes: e,
    });
  }
  function Ir(e, t) {
    return new kt({
      check: `string_format`,
      format: `starts_with`,
      ...E(t),
      prefix: e,
    });
  }
  function Lr(e, t) {
    return new At({
      check: `string_format`,
      format: `ends_with`,
      ...E(t),
      suffix: e,
    });
  }
  function Rr(e) {
    return new jt({ check: `overwrite`, tx: e });
  }
  function zr(e) {
    return Rr((t) => t.normalize(e));
  }
  function Br() {
    return Rr((e) => e.trim());
  }
  function Vr() {
    return Rr((e) => e.toLowerCase());
  }
  function Hr() {
    return Rr((e) => e.toUpperCase());
  }
  function Ur() {
    return Rr((e) => re(e));
  }
  function Wr(e, t, n) {
    return new e({ type: `array`, element: t, ...E(n) });
  }
  function Gr(e, t, n) {
    return new e({ type: `custom`, check: `custom`, fn: t, ...E(n) });
  }
  function Kr(e, t) {
    const n = qr(
      (t) => (
        (t.addIssue = (e) => {
          if (typeof e == `string`) t.issues.push(we(e, t.value, n._zod.def));
          else {
            const r = e;
            r.fatal && (r.continue = !1),
              (r.code ??= `custom`),
              (r.input ??= t.value),
              (r.inst ??= n),
              (r.continue ??= !n._zod.def.abort),
              t.issues.push(we(r));
          }
        }),
        e(t.value, t)
      ),
      t,
    );
    return n;
  }
  function qr(e, t) {
    const n = new P({ check: `custom`, ...E(t) });
    return (n._zod.check = e), n;
  }
  function Jr(e) {
    let t = e?.target ?? `draft-2020-12`;
    return (
      t === `draft-4` && (t = `draft-04`),
      t === `draft-7` && (t = `draft-07`),
      {
        processors: e.processors ?? {},
        metadataRegistry: e?.metadata ?? Gn,
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
  function W(e, t, n = { path: [], schemaPath: [] }) {
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
      a && ((o.ref ||= a), W(a, t, r), (t.seen.get(a).isParent = !0));
    }
    const c = t.metadataRegistry.get(e);
    return (
      c && Object.assign(o.schema, c),
      t.io === `input` &&
        G(e) &&
        (delete o.schema.examples, delete o.schema.default),
      t.io === `input` &&
        `_prefault` in o.schema &&
        ((r = o.schema).default ?? (r.default = o.schema._prefault)),
      delete o.schema._prefault,
      t.seen.get(e).schema
    );
  }
  function Yr(e, t) {
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
  function Xr(e, t) {
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
              input: Qr(t, `input`, e.processors),
              output: Qr(t, `output`, e.processors),
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
  function G(e, t) {
    const n = t ?? { seen: new Set() };
    if (n.seen.has(e)) return !1;
    n.seen.add(e);
    const r = e._zod.def;
    if (r.type === `transform`) return !0;
    if (r.type === `array`) return G(r.element, n);
    if (r.type === `set`) return G(r.valueType, n);
    if (r.type === `lazy`) return G(r.getter(), n);
    if (
      r.type === `promise` ||
      r.type === `optional` ||
      r.type === `nonoptional` ||
      r.type === `nullable` ||
      r.type === `readonly` ||
      r.type === "default" ||
      r.type === `prefault`
    )
      return G(r.innerType, n);
    if (r.type === `intersection`) return G(r.left, n) || G(r.right, n);
    if (r.type === `record` || r.type === `map`)
      return G(r.keyType, n) || G(r.valueType, n);
    if (r.type === `pipe`)
      return e._zod.traits.has(`$ZodCodec`) ? !0 : G(r.in, n) || G(r.out, n);
    if (r.type === `object`) {
      for (const e in r.shape) if (G(r.shape[e], n)) return !0;
      return !1;
    }
    if (r.type === `union`) {
      for (const e of r.options) if (G(e, n)) return !0;
      return !1;
    }
    if (r.type === `tuple`) {
      for (const e of r.items) if (G(e, n)) return !0;
      return !!(r.rest && G(r.rest, n));
    }
    return !1;
  }
  var Zr =
      (e, t = {}) =>
      (n) => {
        const r = Jr({ ...n, processors: t });
        return W(e, r), Yr(r, e), Xr(r, e);
      },
    Qr =
      (e, t, n = {}) =>
      (r) => {
        const { libraryOptions: i, target: a } = r ?? {},
          o = Jr({ ...(i ?? {}), target: a, io: t, processors: n });
        return W(e, o), Yr(o, e), Xr(o, e);
      },
    $r = {
      guid: `uuid`,
      url: `uri`,
      datetime: `date-time`,
      json_string: `json-string`,
      regex: ``,
    },
    ei = (e, t, n, r) => {
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
          ((i.format = $r[s] ?? s),
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
    ti = (e, t, n, r) => {
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
    ni = (e, t, n, r) => {
      n.type = `boolean`;
    },
    ri = (e, t, n, r) => {
      t.target === `openapi-3.0`
        ? ((n.type = `string`), (n.nullable = !0), (n.enum = [null]))
        : (n.type = `null`);
    },
    ii = (e, t, n, r) => {
      n.not = {};
    },
    ai = (e, t, n, r) => {
      const i = e._zod.def,
        a = _(i.entries);
      a.every((e) => typeof e == `number`) && (n.type = `number`),
        a.every((e) => typeof e == `string`) && (n.type = `string`),
        (n.enum = a);
    },
    oi = (e, t, n, r) => {
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
    si = (e, t, n, r) => {
      if (t.unrepresentable === `throw`)
        throw Error(`Custom types cannot be represented in JSON Schema`);
    },
    ci = (e, t, n, r) => {
      if (t.unrepresentable === `throw`)
        throw Error(`Transforms cannot be represented in JSON Schema`);
    },
    li = (e, t, n, r) => {
      const i = n,
        a = e._zod.def,
        { minimum: o, maximum: s } = e._zod.bag;
      typeof o == `number` && (i.minItems = o),
        typeof s == `number` && (i.maxItems = s),
        (i.type = `array`),
        (i.items = W(a.element, t, { ...r, path: [...r.path, `items`] }));
    },
    ui = (e, t, n, r) => {
      const i = n,
        a = e._zod.def;
      (i.type = `object`), (i.properties = {});
      const o = a.shape;
      for (const e in o)
        i.properties[e] = W(o[e], t, {
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
              (i.additionalProperties = W(a.catchall, t, {
                ...r,
                path: [...r.path, `additionalProperties`],
              }))
            : t.io === `output` && (i.additionalProperties = !1);
    },
    di = (e, t, n, r) => {
      const i = e._zod.def,
        a = i.inclusive === !1,
        o = i.options.map((e, n) =>
          W(e, t, { ...r, path: [...r.path, a ? `oneOf` : `anyOf`, n] }),
        );
      a ? (n.oneOf = o) : (n.anyOf = o);
    },
    fi = (e, t, n, r) => {
      const i = e._zod.def,
        a = W(i.left, t, { ...r, path: [...r.path, `allOf`, 0] }),
        o = W(i.right, t, { ...r, path: [...r.path, `allOf`, 1] }),
        s = (e) => `allOf` in e && Object.keys(e).length === 1;
      n.allOf = [...(s(a) ? a.allOf : [a]), ...(s(o) ? o.allOf : [o])];
    },
    pi = (e, t, n, r) => {
      const i = n,
        a = e._zod.def;
      i.type = `object`;
      const o = a.keyType,
        s = o._zod.bag?.patterns;
      if (a.mode === `loose` && s && s.size > 0) {
        const e = W(a.valueType, t, {
          ...r,
          path: [...r.path, `patternProperties`, `*`],
        });
        i.patternProperties = {};
        for (const t of s) i.patternProperties[t.source] = e;
      } else
        (t.target === `draft-07` || t.target === `draft-2020-12`) &&
          (i.propertyNames = W(a.keyType, t, {
            ...r,
            path: [...r.path, `propertyNames`],
          })),
          (i.additionalProperties = W(a.valueType, t, {
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
    mi = (e, t, n, r) => {
      const i = e._zod.def,
        a = W(i.innerType, t, r),
        o = t.seen.get(e);
      t.target === `openapi-3.0`
        ? ((o.ref = i.innerType), (n.nullable = !0))
        : (n.anyOf = [a, { type: `null` }]);
    },
    hi = (e, t, n, r) => {
      const i = e._zod.def;
      W(i.innerType, t, r);
      const a = t.seen.get(e);
      a.ref = i.innerType;
    },
    gi = (e, t, n, r) => {
      const i = e._zod.def;
      W(i.innerType, t, r);
      const a = t.seen.get(e);
      (a.ref = i.innerType),
        (n.default = JSON.parse(JSON.stringify(i.defaultValue)));
    },
    _i = (e, t, n, r) => {
      const i = e._zod.def;
      W(i.innerType, t, r);
      const a = t.seen.get(e);
      (a.ref = i.innerType),
        t.io === `input` &&
          (n._prefault = JSON.parse(JSON.stringify(i.defaultValue)));
    },
    vi = (e, t, n, r) => {
      const i = e._zod.def;
      W(i.innerType, t, r);
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
    yi = (e, t, n, r) => {
      const i = e._zod.def,
        a = i.in._zod.traits.has(`$ZodTransform`),
        o = t.io === `input` ? (a ? i.out : i.in) : i.out;
      W(o, t, r);
      const s = t.seen.get(e);
      s.ref = o;
    },
    bi = (e, t, n, r) => {
      const i = e._zod.def;
      W(i.innerType, t, r);
      const a = t.seen.get(e);
      (a.ref = i.innerType), (n.readOnly = !0);
    },
    xi = (e, t, n, r) => {
      const i = e._zod.def;
      W(i.innerType, t, r);
      const a = t.seen.get(e);
      a.ref = i.innerType;
    },
    Si = f(`ZodISODateTime`, (e, t) => {
      B.init(e, t), J.init(e, t);
    });
  function Ci(e) {
    return mr(Si, e);
  }
  var wi = f(`ZodISODate`, (e, t) => {
    Wt.init(e, t), J.init(e, t);
  });
  function Ti(e) {
    return hr(wi, e);
  }
  var Ei = f(`ZodISOTime`, (e, t) => {
    Gt.init(e, t), J.init(e, t);
  });
  function Di(e) {
    return gr(Ei, e);
  }
  var Oi = f(`ZodISODuration`, (e, t) => {
    Kt.init(e, t), J.init(e, t);
  });
  function ki(e) {
    return _r(Oi, e);
  }
  var Ai = f(
      `ZodError`,
      (e, t) => {
        Ee.init(e, t),
          (e.name = `ZodError`),
          Object.defineProperties(e, {
            format: { value: (t) => ke(e, t) },
            flatten: { value: (t) => Oe(e, t) },
            addIssue: {
              value: (t) => {
                e.issues.push(t), (e.message = JSON.stringify(e.issues, v, 2));
              },
            },
            addIssues: {
              value: (t) => {
                e.issues.push(...t),
                  (e.message = JSON.stringify(e.issues, v, 2));
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
    ji = Ae(Ai),
    Mi = je(Ai),
    Ni = Me(Ai),
    Pi = Pe(Ai),
    Fi = Ie(Ai),
    Ii = Le(Ai),
    Li = Re(Ai),
    Ri = ze(Ai),
    zi = Be(Ai),
    Bi = Ve(Ai),
    Vi = k(Ai),
    Hi = He(Ai),
    Ui = new WeakMap();
  function Wi(e, t, n) {
    let r = Object.getPrototypeOf(e),
      i = Ui.get(r);
    if ((i || ((i = new Set()), Ui.set(r, i)), !i.has(t))) {
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
  var K = f(
      `ZodType`,
      (e, t) => (
        L.init(e, t),
        Object.assign(e[`~standard`], {
          jsonSchema: { input: Qr(e, `input`), output: Qr(e, `output`) },
        }),
        (e.toJSONSchema = Zr(e, {})),
        (e.def = t),
        (e.type = t.type),
        Object.defineProperty(e, "_def", { value: t }),
        (e.parse = (t, n) => ji(e, t, n, { callee: e.parse })),
        (e.safeParse = (t, n) => Ni(e, t, n)),
        (e.parseAsync = async (t, n) => Mi(e, t, n, { callee: e.parseAsync })),
        (e.safeParseAsync = async (t, n) => Pi(e, t, n)),
        (e.spa = e.safeParseAsync),
        (e.encode = (t, n) => Fi(e, t, n)),
        (e.decode = (t, n) => Ii(e, t, n)),
        (e.encodeAsync = async (t, n) => Li(e, t, n)),
        (e.decodeAsync = async (t, n) => Ri(e, t, n)),
        (e.safeEncode = (t, n) => zi(e, t, n)),
        (e.safeDecode = (t, n) => Bi(e, t, n)),
        (e.safeEncodeAsync = async (t, n) => Vi(e, t, n)),
        (e.safeDecodeAsync = async (t, n) => Hi(e, t, n)),
        Wi(e, `ZodType`, {
          check(...e) {
            const t = this.def;
            return this.clone(
              te(t, {
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
            return ue(this, e, t);
          },
          brand() {
            return this;
          },
          register(e, t) {
            return e.add(this, t), this;
          },
          refine(e, t) {
            return this.check(io(e, t));
          },
          superRefine(e, t) {
            return this.check(ao(e, t));
          },
          overwrite(e) {
            return this.check(Rr(e));
          },
          optional() {
            return Ba(this);
          },
          exactOptional() {
            return Ha(this);
          },
          nullable() {
            return Wa(this);
          },
          nullish() {
            return Ba(Wa(this));
          },
          nonoptional(e) {
            return Xa(this, e);
          },
          array() {
            return wa(this);
          },
          or(e) {
            return Da([this, e]);
          },
          and(e) {
            return ja(this, e);
          },
          transform(e) {
            return eo(this, Ra(e));
          },
          default(e) {
            return Ka(this, e);
          },
          prefault(e) {
            return Ja(this, e);
          },
          catch(e) {
            return Qa(this, e);
          },
          pipe(e) {
            return eo(this, e);
          },
          readonly() {
            return no(this);
          },
          describe(e) {
            const t = this.clone();
            return Gn.add(t, { description: e }), t;
          },
          meta(...e) {
            if (e.length === 0) return Gn.get(this);
            const t = this.clone();
            return Gn.add(t, e[0]), t;
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
            return Gn.get(e)?.description;
          },
          configurable: !0,
        }),
        e
      ),
    ),
    Gi = f(`_ZodString`, (e, t) => {
      Nt.init(e, t),
        K.init(e, t),
        (e._zod.processJSONSchema = (t, n, r) => ei(e, t, n, r));
      const n = e._zod.bag;
      (e.format = n.format ?? null),
        (e.minLength = n.minimum ?? null),
        (e.maxLength = n.maximum ?? null),
        Wi(e, `_ZodString`, {
          regex(...e) {
            return this.check(Mr(...e));
          },
          includes(...e) {
            return this.check(Fr(...e));
          },
          startsWith(...e) {
            return this.check(Ir(...e));
          },
          endsWith(...e) {
            return this.check(Lr(...e));
          },
          min(...e) {
            return this.check(Ar(...e));
          },
          max(...e) {
            return this.check(kr(...e));
          },
          length(...e) {
            return this.check(jr(...e));
          },
          nonempty(...e) {
            return this.check(Ar(1, ...e));
          },
          lowercase(e) {
            return this.check(Nr(e));
          },
          uppercase(e) {
            return this.check(Pr(e));
          },
          trim() {
            return this.check(Br());
          },
          normalize(...e) {
            return this.check(zr(...e));
          },
          toLowerCase() {
            return this.check(Vr());
          },
          toUpperCase() {
            return this.check(Hr());
          },
          slugify() {
            return this.check(Ur());
          },
        });
    }),
    Ki = f(`ZodString`, (e, t) => {
      Nt.init(e, t),
        Gi.init(e, t),
        (e.email = (t) => e.check(qn(qi, t))),
        (e.url = (t) => e.check($n(Xi, t))),
        (e.jwt = (t) => e.check(U(da, t))),
        (e.emoji = (t) => e.check(er(Zi, t))),
        (e.guid = (t) => e.check(Jn(Ji, t))),
        (e.uuid = (t) => e.check(Yn(Yi, t))),
        (e.uuidv4 = (t) => e.check(Xn(Yi, t))),
        (e.uuidv6 = (t) => e.check(Zn(Yi, t))),
        (e.uuidv7 = (t) => e.check(Qn(Yi, t))),
        (e.nanoid = (t) => e.check(tr(Qi, t))),
        (e.guid = (t) => e.check(Jn(Ji, t))),
        (e.cuid = (t) => e.check(nr($i, t))),
        (e.cuid2 = (t) => e.check(rr(ea, t))),
        (e.ulid = (t) => e.check(ir(ta, t))),
        (e.base64 = (t) => e.check(dr(ca, t))),
        (e.base64url = (t) => e.check(fr(la, t))),
        (e.xid = (t) => e.check(ar(na, t))),
        (e.ksuid = (t) => e.check(or(ra, t))),
        (e.ipv4 = (t) => e.check(sr(ia, t))),
        (e.ipv6 = (t) => e.check(cr(aa, t))),
        (e.cidrv4 = (t) => e.check(lr(oa, t))),
        (e.cidrv6 = (t) => e.check(ur(sa, t))),
        (e.e164 = (t) => e.check(pr(ua, t))),
        (e.datetime = (t) => e.check(Ci(t))),
        (e.date = (t) => e.check(Ti(t))),
        (e.time = (t) => e.check(Di(t))),
        (e.duration = (t) => e.check(ki(t)));
    });
  function q(e) {
    return Kn(Ki, e);
  }
  var J = f(`ZodStringFormat`, (e, t) => {
      R.init(e, t), Gi.init(e, t);
    }),
    qi = f(`ZodEmail`, (e, t) => {
      It.init(e, t), J.init(e, t);
    }),
    Ji = f(`ZodGUID`, (e, t) => {
      Pt.init(e, t), J.init(e, t);
    }),
    Yi = f(`ZodUUID`, (e, t) => {
      Ft.init(e, t), J.init(e, t);
    }),
    Xi = f(`ZodURL`, (e, t) => {
      Lt.init(e, t), J.init(e, t);
    }),
    Zi = f(`ZodEmoji`, (e, t) => {
      Rt.init(e, t), J.init(e, t);
    }),
    Qi = f(`ZodNanoID`, (e, t) => {
      zt.init(e, t), J.init(e, t);
    }),
    $i = f(`ZodCUID`, (e, t) => {
      Bt.init(e, t), J.init(e, t);
    }),
    ea = f(`ZodCUID2`, (e, t) => {
      z.init(e, t), J.init(e, t);
    }),
    ta = f(`ZodULID`, (e, t) => {
      Vt.init(e, t), J.init(e, t);
    }),
    na = f(`ZodXID`, (e, t) => {
      Ht.init(e, t), J.init(e, t);
    }),
    ra = f(`ZodKSUID`, (e, t) => {
      Ut.init(e, t), J.init(e, t);
    }),
    ia = f(`ZodIPv4`, (e, t) => {
      qt.init(e, t), J.init(e, t);
    }),
    aa = f(`ZodIPv6`, (e, t) => {
      Jt.init(e, t), J.init(e, t);
    }),
    oa = f(`ZodCIDRv4`, (e, t) => {
      V.init(e, t), J.init(e, t);
    }),
    sa = f(`ZodCIDRv6`, (e, t) => {
      Yt.init(e, t), J.init(e, t);
    }),
    ca = f(`ZodBase64`, (e, t) => {
      Zt.init(e, t), J.init(e, t);
    }),
    la = f(`ZodBase64URL`, (e, t) => {
      $t.init(e, t), J.init(e, t);
    }),
    ua = f(`ZodE164`, (e, t) => {
      en.init(e, t), J.init(e, t);
    }),
    da = f(`ZodJWT`, (e, t) => {
      nn.init(e, t), J.init(e, t);
    }),
    fa = f(`ZodNumber`, (e, t) => {
      rn.init(e, t),
        K.init(e, t),
        (e._zod.processJSONSchema = (t, n, r) => ti(e, t, n, r)),
        Wi(e, `ZodNumber`, {
          gt(e, t) {
            return this.check(Er(e, t));
          },
          gte(e, t) {
            return this.check(Dr(e, t));
          },
          min(e, t) {
            return this.check(Dr(e, t));
          },
          lt(e, t) {
            return this.check(wr(e, t));
          },
          lte(e, t) {
            return this.check(Tr(e, t));
          },
          max(e, t) {
            return this.check(Tr(e, t));
          },
          int(e) {
            return this.check(ma(e));
          },
          safe(e) {
            return this.check(ma(e));
          },
          positive(e) {
            return this.check(Er(0, e));
          },
          nonnegative(e) {
            return this.check(Dr(0, e));
          },
          negative(e) {
            return this.check(wr(0, e));
          },
          nonpositive(e) {
            return this.check(Tr(0, e));
          },
          multipleOf(e, t) {
            return this.check(Or(e, t));
          },
          step(e, t) {
            return this.check(Or(e, t));
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
  function Y(e) {
    return vr(fa, e);
  }
  var pa = f(`ZodNumberFormat`, (e, t) => {
    an.init(e, t), fa.init(e, t);
  });
  function ma(e) {
    return yr(pa, e);
  }
  var ha = f(`ZodBoolean`, (e, t) => {
    on.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => ni(e, t, n, r));
  });
  function ga(e) {
    return br(ha, e);
  }
  var _a = f(`ZodNull`, (e, t) => {
    sn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => ri(e, t, n, r));
  });
  function va(e) {
    return xr(_a, e);
  }
  var ya = f(`ZodUnknown`, (e, t) => {
    cn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (e, t, n) => void 0);
  });
  function ba() {
    return Sr(ya);
  }
  var xa = f(`ZodNever`, (e, t) => {
    ln.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => ii(e, t, n, r));
  });
  function Sa(e) {
    return Cr(xa, e);
  }
  var Ca = f(`ZodArray`, (e, t) => {
    dn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => li(e, t, n, r)),
      (e.element = t.element),
      Wi(e, `ZodArray`, {
        min(e, t) {
          return this.check(Ar(e, t));
        },
        nonempty(e) {
          return this.check(Ar(1, e));
        },
        max(e, t) {
          return this.check(kr(e, t));
        },
        length(e, t) {
          return this.check(jr(e, t));
        },
        unwrap() {
          return this.element;
        },
      });
  });
  function wa(e, t) {
    return Wr(Ca, e, t);
  }
  var Ta = f(`ZodObject`, (e, t) => {
    gn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => ui(e, t, n, r)),
      C(e, `shape`, () => t.shape),
      Wi(e, `ZodObject`, {
        keyof() {
          return Fa(Object.keys(this._zod.def.shape));
        },
        catchall(e) {
          return this.clone({ ...this._zod.def, catchall: e });
        },
        passthrough() {
          return this.clone({ ...this._zod.def, catchall: ba() });
        },
        loose() {
          return this.clone({ ...this._zod.def, catchall: ba() });
        },
        strict() {
          return this.clone({ ...this._zod.def, catchall: Sa() });
        },
        strip() {
          return this.clone({ ...this._zod.def, catchall: void 0 });
        },
        extend(e) {
          return he(this, e);
        },
        safeExtend(e) {
          return ge(this, e);
        },
        merge(e) {
          return _e(this, e);
        },
        pick(e) {
          return pe(this, e);
        },
        omit(e) {
          return me(this, e);
        },
        partial(...e) {
          return D(za, this, e[0]);
        },
        required(...e) {
          return ve(Ya, this, e[0]);
        },
      });
  });
  function X(e, t) {
    return new Ta({ type: `object`, shape: e ?? {}, ...E(t) });
  }
  var Ea = f(`ZodUnion`, (e, t) => {
    vn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => di(e, t, n, r)),
      (e.options = t.options);
  });
  function Da(e, t) {
    return new Ea({ type: `union`, options: e, ...E(t) });
  }
  var Oa = f(`ZodDiscriminatedUnion`, (e, t) => {
    Ea.init(e, t), yn.init(e, t);
  });
  function ka(e, t, n) {
    return new Oa({ type: `union`, options: t, discriminator: e, ...E(n) });
  }
  var Aa = f(`ZodIntersection`, (e, t) => {
    bn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => fi(e, t, n, r));
  });
  function ja(e, t) {
    return new Aa({ type: `intersection`, left: e, right: t });
  }
  var Ma = f(`ZodRecord`, (e, t) => {
    Cn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => pi(e, t, n, r)),
      (e.keyType = t.keyType),
      (e.valueType = t.valueType);
  });
  function Na(e, t, n) {
    return !t || !t._zod
      ? new Ma({ type: `record`, keyType: q(), valueType: e, ...E(t) })
      : new Ma({ type: `record`, keyType: e, valueType: t, ...E(n) });
  }
  var Pa = f(`ZodEnum`, (e, t) => {
    wn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => ai(e, t, n, r)),
      (e.enum = t.entries),
      (e.options = Object.values(t.entries));
    const n = new Set(Object.keys(t.entries));
    (e.extract = (e, r) => {
      const i = {};
      for (const r of e)
        if (n.has(r)) i[r] = t.entries[r];
        else throw Error(`Key ${r} not found in enum`);
      return new Pa({ ...t, checks: [], ...E(r), entries: i });
    }),
      (e.exclude = (e, r) => {
        const i = { ...t.entries };
        for (const t of e)
          if (n.has(t)) delete i[t];
          else throw Error(`Key ${t} not found in enum`);
        return new Pa({ ...t, checks: [], ...E(r), entries: i });
      });
  });
  function Fa(e, t) {
    return new Pa({
      type: `enum`,
      entries: Array.isArray(e) ? Object.fromEntries(e.map((e) => [e, e])) : e,
      ...E(t),
    });
  }
  var Ia = f(`ZodLiteral`, (e, t) => {
    Tn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => oi(e, t, n, r)),
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
  function Z(e, t) {
    return new Ia({
      type: `literal`,
      values: Array.isArray(e) ? e : [e],
      ...E(t),
    });
  }
  var La = f(`ZodTransform`, (e, t) => {
    En.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => ci(e, t, n, r)),
      (e._zod.parse = (n, r) => {
        if (r.direction === `backward`) throw new m(e.constructor.name);
        n.addIssue = (r) => {
          if (typeof r == `string`) n.issues.push(we(r, n.value, t));
          else {
            const t = r;
            t.fatal && (t.continue = !1),
              (t.code ??= `custom`),
              (t.input ??= n.value),
              (t.inst ??= e),
              n.issues.push(we(t));
          }
        };
        const i = t.transform(n.value, n);
        return i instanceof Promise
          ? i.then((e) => ((n.value = e), (n.fallback = !0), n))
          : ((n.value = i), (n.fallback = !0), n);
      });
  });
  function Ra(e) {
    return new La({ type: `transform`, transform: e });
  }
  var za = f(`ZodOptional`, (e, t) => {
    On.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => xi(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function Ba(e) {
    return new za({ type: `optional`, innerType: e });
  }
  var Va = f(`ZodExactOptional`, (e, t) => {
    kn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => xi(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function Ha(e) {
    return new Va({ type: `optional`, innerType: e });
  }
  var Ua = f(`ZodNullable`, (e, t) => {
    An.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => mi(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function Wa(e) {
    return new Ua({ type: `nullable`, innerType: e });
  }
  var Ga = f(`ZodDefault`, (e, t) => {
    jn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => gi(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType),
      (e.removeDefault = e.unwrap);
  });
  function Ka(e, t) {
    return new Ga({
      type: `default`,
      innerType: e,
      get defaultValue() {
        return typeof t == `function` ? t() : ce(t);
      },
    });
  }
  var qa = f(`ZodPrefault`, (e, t) => {
    H.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => _i(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function Ja(e, t) {
    return new qa({
      type: `prefault`,
      innerType: e,
      get defaultValue() {
        return typeof t == `function` ? t() : ce(t);
      },
    });
  }
  var Ya = f(`ZodNonOptional`, (e, t) => {
    Nn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => hi(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function Xa(e, t) {
    return new Ya({ type: `nonoptional`, innerType: e, ...E(t) });
  }
  var Za = f(`ZodCatch`, (e, t) => {
    Fn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => vi(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType),
      (e.removeCatch = e.unwrap);
  });
  function Qa(e, t) {
    return new Za({
      type: `catch`,
      innerType: e,
      catchValue: typeof t == `function` ? t : () => t,
    });
  }
  var $a = f(`ZodPipe`, (e, t) => {
    In.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => yi(e, t, n, r)),
      (e.in = t.in),
      (e.out = t.out);
  });
  function eo(e, t) {
    return new $a({ type: `pipe`, in: e, out: t });
  }
  var to = f(`ZodReadonly`, (e, t) => {
    Rn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => bi(e, t, n, r)),
      (e.unwrap = () => e._zod.def.innerType);
  });
  function no(e) {
    return new to({ type: `readonly`, innerType: e });
  }
  var ro = f(`ZodCustom`, (e, t) => {
    Bn.init(e, t),
      K.init(e, t),
      (e._zod.processJSONSchema = (t, n, r) => si(e, t, n, r));
  });
  function io(e, t = {}) {
    return Gr(ro, e, t);
  }
  function ao(e, t) {
    return Kr(e, t);
  }
  var oo = q().trim().min(1).max(128),
    so = q().trim().min(1).max(128),
    co = X({
      questionId: oo,
      position: Y().int().positive(),
      total: Y().int().positive(),
      predictionEdition: so,
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
  Y().int().nonnegative().brand();
  var lo = X({
      predictionEdition: so,
      questionId: oo,
      sitePosition: Y().int().positive(),
      siteTotal: Y().int().positive(),
      tags: wa(q().trim().min(1).max(128)).max(64),
      mediaLocator: q().trim().min(1).max(2048).optional(),
      discoveredAt: q().datetime(),
      schemaVersion: Y().int().positive(),
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
    uo = X({
      predictionEdition: so,
      orderedQuestionIds: wa(oo),
      siteTotal: Y().int().positive(),
      completeness: Fa([`complete`, `partial`]),
      checkpointPosition: Y().int().positive().optional(),
      schemaVersion: Y().int().positive(),
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
    fo = Fa([
      `missing`,
      `extra`,
      `spelling`,
      `substitution`,
      `order`,
      `word_form`,
    ]),
    po = X({ expected: q().max(256), actual: q().max(256), type: fo }).strict(),
    mo = X({
      attemptId: q().uuid(),
      questionId: oo,
      accuracy: Y().finite().min(0).max(1),
      durationMs: Y().int().nonnegative(),
      replayCount: Y().int().nonnegative(),
      errors: wa(po).max(512),
      completedAt: q().datetime(),
    }).strict(),
    ho = X({
      questionId: oo,
      dueScore: Y().finite().min(0).max(1),
      weaknessScore: Y().finite().min(0).max(1),
      noveltyScore: Y().finite().min(0).max(1),
      marked: ga(),
      attemptCount: Y().int().nonnegative(),
      lastAttemptAt: q().datetime().nullable(),
    }).strict(),
    go = X({
      predictionEdition: so,
      questionId: oo,
      text: q().max(2e4),
      revision: Y().int().nonnegative(),
      updatedAt: q().datetime(),
    }).strict();
  X({
    questionId: oo,
    dueAt: q().datetime().nullable(),
    attemptCount: Y().int().nonnegative(),
    errorCount: Y().int().nonnegative(),
    lastAccuracy: Y().finite().min(0).max(1).nullable(),
    lastAttemptAt: q().datetime().nullable(),
    marked: ga(),
  }).strict();
  var _o = X({ question: co.nullable(), draft: go.nullable() }).strict(),
    vo = X({
      learnerStateVersion: Y().int().nonnegative(),
      candidates: wa(ho).max(500),
    }).strict(),
    yo = Fa([`practice`, `exam`]),
    bo = Fa([`site-player-only`, `transfer-to-extension`]),
    xo = X({
      id: Z(`current`),
      mode: yo,
      audioStrategy: bo,
      keymap: Na(q().min(1).max(64), q().min(1).max(64)),
      updatedAt: q().datetime(),
    }).strict(),
    So = X({
      key: q().min(1).max(1024),
      expected: q().max(256),
      actual: q().max(256),
      type: po.shape.type,
      occurrences: Y().int().positive(),
      lastSeenAt: q().datetime(),
    }).strict(),
    Co = q().uuid(),
    Q = (e) => X({ requestId: Co, ...e }).strict(),
    wo = ka(`action`, [
      Q({
        action: Z(`storage/loadDraft`),
        predictionEdition: so,
        questionId: oo,
      }),
      Q({ action: Z(`storage/saveDraft`), draft: go }),
      Q({
        action: Z(`storage/commitAttempt`),
        predictionEdition: so,
        attempt: mo,
      }),
      Q({
        action: Z(`storage/setMarked`),
        predictionEdition: so,
        questionId: oo,
        marked: ga(),
      }),
      Q({
        action: Z(`storage/getRankCandidates`),
        predictionEdition: so,
        questionIds: wa(oo).min(1).max(500),
      }),
      Q({ action: Z(`storage/restoreSession`) }),
      Q({ action: Z(`storage/saveSession`), question: co }),
      Q({ action: Z(`storage/loadIndexSnapshot`), predictionEdition: so }),
      Q({
        action: Z(`storage/saveIndexSnapshot`),
        snapshot: uo,
        questions: wa(lo),
      }),
      Q({ action: Z(`storage/loadSettings`) }),
      Q({ action: Z(`storage/saveSettings`), settings: xo }),
      Q({
        action: Z(`storage/listWordStats`),
        limit: Y().int().positive().max(500),
      }),
      Q({
        action: Z(`storage/matchVerifiedEdition`),
        questionId: oo,
        position: Y().int().positive(),
        total: Y().int().positive(),
      }),
    ]),
    $ = (e) => X({ requestId: Co, ok: Z(!0), ...e }).strict(),
    To = ka(`action`, [
      $({ action: Z(`storage/loadDraft`), draft: go.nullable() }),
      $({ action: Z(`storage/saveDraft`) }),
      $({ action: Z(`storage/commitAttempt`) }),
      $({ action: Z(`storage/setMarked`) }),
      $({ action: Z(`storage/getRankCandidates`), snapshot: vo }),
      $({ action: Z(`storage/restoreSession`), session: _o }),
      $({ action: Z(`storage/saveSession`) }),
      $({
        action: Z(`storage/loadIndexSnapshot`),
        snapshot: uo.nullable(),
        questions: wa(lo),
      }),
      $({ action: Z(`storage/saveIndexSnapshot`) }),
      $({ action: Z(`storage/loadSettings`), settings: xo.nullable() }),
      $({ action: Z(`storage/saveSettings`) }),
      $({ action: Z(`storage/listWordStats`), words: wa(So) }),
      $({ action: Z(`storage/matchVerifiedEdition`), edition: so.nullable() }),
    ]),
    Eo = Fa([`invalid-request`, `storage-failure`]),
    Do = X({
      requestId: Co,
      ok: Z(!1),
      action: q().min(1).max(128),
      reason: Eo,
    }).strict(),
    Oo = Da([To, Do]);
  X({
    code: Fa([
      `AUTH_REQUIRED`,
      `SITE_CHANGED`,
      `DESYNC`,
      `AUDIO_ERROR`,
      `INDEX_PARTIAL`,
      `STORAGE_ERROR`,
    ]),
    message: q().trim().min(1).max(1024),
    recoverable: ga(),
    details: Na(q(), Da([q(), Y().finite(), ga(), va()])).optional(),
  }).strict();
  function ko(e) {
    const t = e.searchParams.getAll(`pageSource`);
    return (
      e.origin === `https://www.fireflyau.com` &&
      e.pathname === `/ptehome/exercise` &&
      (t.length === 0 || (t.length === 1 && t[0] === `yc`))
    );
  }
  function Ao(e, t) {
    if (e.id !== t || !e.url) return !1;
    try {
      return ko(new URL(e.url));
    } catch {
      return !1;
    }
  }
  function jo(e) {
    return e instanceof Mo ? `invalid-request` : `storage-failure`;
  }
  var Mo = class extends Error {};
  function No(e) {
    switch (e.action) {
      case `storage/loadDraft`:
      case `storage/commitAttempt`:
      case `storage/setMarked`:
      case `storage/getRankCandidates`:
      case `storage/loadIndexSnapshot`:
        return [e.predictionEdition];
      case `storage/saveDraft`:
        return [e.draft.predictionEdition];
      case `storage/saveSession`:
        return [e.question.predictionEdition];
      case `storage/saveIndexSnapshot`:
        return [
          e.snapshot.predictionEdition,
          ...e.questions.map((e) => e.predictionEdition),
        ];
      default:
        return [];
    }
  }
  var Po = [`provisional:`, `session:`];
  function Fo(e) {
    return No(e).some((e) => Po.some((t) => e.startsWith(t)));
  }
  function Io(e, t) {
    return Do.parse({
      requestId: e.requestId,
      ok: !1,
      action: e.action,
      reason: jo(t),
    });
  }
  function Lo(e) {
    return async (t, n) => {
      if (!Ao(n, e.extensionId)) return;
      const r = wo.safeParse(t);
      if (!r.success) return;
      const i = r.data;
      try {
        if (Fo(i))
          throw new Mo(
            `ephemeral prediction edition cannot cross the runtime boundary`,
          );
        const t = await Ro(i, e);
        return Oo.parse(t);
      } catch (e) {
        return Io(i, e);
      }
    };
  }
  async function Ro(e, t) {
    const { repository: n } = t;
    switch (e.action) {
      case `storage/loadDraft`:
        return {
          requestId: e.requestId,
          ok: !0,
          action: e.action,
          draft: await n.loadDraft(e.predictionEdition, e.questionId),
        };
      case `storage/saveDraft`:
        return (
          await n.saveDraft(e.draft),
          { requestId: e.requestId, ok: !0, action: e.action }
        );
      case `storage/commitAttempt`:
        return (
          await n.commitAttempt(e.predictionEdition, e.attempt),
          { requestId: e.requestId, ok: !0, action: e.action }
        );
      case `storage/setMarked`:
        return (
          await n.setMarked(e.predictionEdition, e.questionId, e.marked),
          { requestId: e.requestId, ok: !0, action: e.action }
        );
      case `storage/getRankCandidates`:
        return {
          requestId: e.requestId,
          ok: !0,
          action: e.action,
          snapshot: await n.getRankCandidates(
            e.predictionEdition,
            e.questionIds,
          ),
        };
      case `storage/restoreSession`:
        return {
          requestId: e.requestId,
          ok: !0,
          action: e.action,
          session: await n.restoreSession(),
        };
      case `storage/saveSession`:
        return (
          await n.saveSession(e.question),
          { requestId: e.requestId, ok: !0, action: e.action }
        );
      case `storage/loadIndexSnapshot`: {
        const t = await n.loadIndexSnapshot(e.predictionEdition);
        return { requestId: e.requestId, ok: !0, action: e.action, ...t };
      }
      case `storage/saveIndexSnapshot`:
        return (
          await n.saveIndexSnapshot(e.snapshot, e.questions),
          { requestId: e.requestId, ok: !0, action: e.action }
        );
      case `storage/loadSettings`:
        return {
          requestId: e.requestId,
          ok: !0,
          action: e.action,
          settings: await n.loadSettings(),
        };
      case `storage/saveSettings`:
        return (
          await n.saveSettings(e.settings),
          { requestId: e.requestId, ok: !0, action: e.action }
        );
      case `storage/listWordStats`:
        return {
          requestId: e.requestId,
          ok: !0,
          action: e.action,
          words: await n.listWordStats(e.limit),
        };
      case `storage/matchVerifiedEdition`:
        return {
          requestId: e.requestId,
          ok: !0,
          action: e.action,
          edition: await n.matchVerifiedEdition({
            questionId: e.questionId,
            position: e.position,
            total: e.total,
          }),
        };
      default:
        throw new Mo(`unsupported runtime action`);
    }
  }
  var zo = c(
      o((e, t) => {
        ((n, r) => {
          typeof e == `object` && t !== void 0
            ? (t.exports = r())
            : typeof define == `function` && define.amd
              ? define(r)
              : ((n = typeof globalThis < `u` ? globalThis : n || self).Dexie =
                  r());
        })(e, () => {
          var e = (t, n) =>
              (e =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array
                  ? (e, t) => {
                      e.__proto__ = t;
                    }
                  : (e, t) => {
                      for (var n in t) Object.hasOwn(t, n) && (e[n] = t[n]);
                    }))(t, n),
            t = function () {
              return (t =
                Object.assign ||
                function (e) {
                  for (var t, n = 1, r = arguments.length; n < r; n++)
                    for (var i in (t = arguments[n]))
                      Object.hasOwn(t, i) && (e[i] = t[i]);
                  return e;
                }).apply(this, arguments);
            };
          function n(e, t, n) {
            if (n || arguments.length === 2)
              for (var r, i = 0, a = t.length; i < a; i++)
                (!r && i in t) ||
                  ((r ||= Array.prototype.slice.call(t, 0, i))[i] = t[i]);
            return e.concat(r || Array.prototype.slice.call(t));
          }
          var r =
              typeof globalThis < `u`
                ? globalThis
                : typeof self < `u`
                  ? self
                  : typeof window < `u`
                    ? window
                    : global,
            i = Object.keys,
            a = Array.isArray;
          function o(e, t) {
            return (
              typeof t == `object` &&
                i(t).forEach((n) => {
                  e[n] = t[n];
                }),
              e
            );
          }
          typeof Promise > `u` || r.Promise || (r.Promise = Promise);
          var s = Object.getPrototypeOf,
            c = {}.hasOwnProperty;
          function l(e, t) {
            return c.call(e, t);
          }
          function u(e, t) {
            typeof t == `function` && (t = t(s(e))),
              (typeof Reflect > `u` ? i : Reflect.ownKeys)(t).forEach((n) => {
                f(e, n, t[n]);
              });
          }
          var d = Object.defineProperty;
          function f(e, t, n, r) {
            d(
              e,
              t,
              o(
                n && l(n, `get`) && typeof n.get == `function`
                  ? { get: n.get, set: n.set, configurable: !0 }
                  : { value: n, configurable: !0, writable: !0 },
                r,
              ),
            );
          }
          function p(e) {
            return {
              from: (t) => (
                (e.prototype = Object.create(t.prototype)),
                f(e.prototype, `constructor`, e),
                { extend: u.bind(null, e.prototype) }
              ),
            };
          }
          var m = Object.getOwnPropertyDescriptor,
            h = [].slice;
          function g(e, t, n) {
            return h.call(e, t, n);
          }
          function _(e, t) {
            return t(e);
          }
          function v(e) {
            if (!e) throw Error(`Assertion Failed`);
          }
          function y(e) {
            r.setImmediate ? setImmediate(e) : setTimeout(e, 0);
          }
          function b(e, t) {
            if (typeof t == `string` && l(e, t)) return e[t];
            if (!t) return e;
            if (typeof t != `string`) {
              for (var n = [], r = 0, i = t.length; r < i; ++r) {
                var a = b(e, t[r]);
                n.push(a);
              }
              return n;
            }
            var o,
              s = t.indexOf(`.`);
            return s === -1 || (o = e[t.substr(0, s)]) == null
              ? void 0
              : b(o, t.substr(s + 1));
          }
          function x(e, t, n) {
            if (
              e &&
              t !== void 0 &&
              !(`isFrozen` in Object && Object.isFrozen(e))
            )
              if (typeof t != `string` && `length` in t) {
                v(typeof n != `string` && `length` in n);
                for (var r = 0, i = t.length; r < i; ++r) x(e, t[r], n[r]);
              } else {
                var o = t.indexOf(`.`);
                if (o !== -1) {
                  var s = t.substr(0, o),
                    o = t.substr(o + 1);
                  if (o === ``)
                    n === void 0
                      ? a(e) && !isNaN(parseInt(s))
                        ? e.splice(s, 1)
                        : delete e[s]
                      : (e[s] = n);
                  else {
                    var c = e[s];
                    if (!c || !l(e, s)) {
                      if (n === void 0) return;
                      c = e[s] = {};
                    }
                    x(c, o, n);
                  }
                } else
                  n === void 0
                    ? a(e) && !isNaN(parseInt(t))
                      ? e.splice(t, 1)
                      : delete e[t]
                    : (e[t] = n);
              }
          }
          function ee(e) {
            var t,
              n = {};
            for (t in e) l(e, t) && (n[t] = e[t]);
            return n;
          }
          var S = [].concat;
          function C(e) {
            return S.apply([], e);
          }
          var w =
              `BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey`
                .split(`,`)
                .concat(
                  C(
                    [8, 16, 32, 64].map((e) =>
                      [`Int`, `Uint`, `Float`].map((t) => t + e + `Array`),
                    ),
                  ),
                )
                .filter((e) => r[e]),
            te = new Set(w.map((e) => r[e])),
            ne = null;
          function re(e) {
            return (
              (ne = new WeakMap()),
              (e = (function e(t) {
                if (!t || typeof t != `object`) return t;
                var n = ne.get(t);
                if (n) return n;
                if (a(t)) {
                  (n = []), ne.set(t, n);
                  for (var r = 0, i = t.length; r < i; ++r) n.push(e(t[r]));
                } else if (te.has(t.constructor)) n = t;
                else {
                  var o,
                    c = s(t);
                  for (o in ((n =
                    c === Object.prototype ? {} : Object.create(c)),
                  ne.set(t, n),
                  t))
                    l(t, o) && (n[o] = e(t[o]));
                }
                return n;
              })(e)),
              (ne = null),
              e
            );
          }
          var ie = {}.toString;
          function ae(e) {
            return ie.call(e).slice(8, -1);
          }
          var oe = typeof Symbol < `u` ? Symbol.iterator : `@@iterator`,
            se =
              typeof oe == `symbol`
                ? (e) => {
                    var t;
                    return e != null && (t = e[oe]) && t.apply(e);
                  }
                : () => null;
          function ce(e, t) {
            (t = e.indexOf(t)), 0 <= t && e.splice(t, 1);
          }
          var le = {};
          function T(e) {
            var t, n, r, i;
            if (arguments.length === 1) {
              if (a(e)) return e.slice();
              if (this === le && typeof e == `string`) return [e];
              if ((i = se(e)))
                for (n = []; !(r = i.next()).done; ) n.push(r.value);
              else {
                if (e == null || typeof (t = e.length) != `number`) return [e];
                for (n = Array(t); t--; ) n[t] = e[t];
              }
            } else
              for (t = arguments.length, n = Array(t); t--; )
                n[t] = arguments[t];
            return n;
          }
          var ue =
              typeof Symbol < `u`
                ? (e) => e[Symbol.toStringTag] === `AsyncFunction`
                : () => !1,
            w = [
              `Unknown`,
              `Constraint`,
              `Data`,
              `TransactionInactive`,
              `ReadOnly`,
              `Version`,
              `NotFound`,
              `InvalidState`,
              `InvalidAccess`,
              `Abort`,
              `Timeout`,
              `QuotaExceeded`,
              `Syntax`,
              `DataClone`,
            ],
            E = [
              `Modify`,
              `Bulk`,
              `OpenFailed`,
              `VersionChange`,
              `Schema`,
              `Upgrade`,
              `InvalidTable`,
              `MissingAPI`,
              `NoSuchDatabase`,
              `InvalidArgument`,
              `SubTransaction`,
              `Unsupported`,
              `Internal`,
              `DatabaseClosed`,
              `PrematureCommit`,
              `ForeignAwait`,
            ].concat(w),
            de = {
              VersionChanged: `Database version changed by other database connection`,
              DatabaseClosed: `Database has been closed`,
              Abort: `Transaction aborted`,
              TransactionInactive: `Transaction has already completed or failed`,
              MissingAPI: `IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb`,
            };
          function fe(e, t) {
            (this.name = e), (this.message = t);
          }
          function pe(e, t) {
            return (
              e +
              `. Errors: ` +
              Object.keys(t)
                .map((e) => t[e].toString())
                .filter((e, t, n) => n.indexOf(e) === t)
                .join(`
`)
            );
          }
          function me(e, t, n, r) {
            (this.failures = t),
              (this.failedKeys = r),
              (this.successCount = n),
              (this.message = pe(e, t));
          }
          function he(e, t) {
            (this.name = `BulkError`),
              (this.failures = Object.keys(t).map((e) => t[e])),
              (this.failuresByPos = t),
              (this.message = pe(e, this.failures));
          }
          p(fe)
            .from(Error)
            .extend({
              toString: function () {
                return this.name + `: ` + this.message;
              },
            }),
            p(me).from(fe),
            p(he).from(fe);
          var ge = E.reduce((e, t) => ((e[t] = t + `Error`), e), {}),
            _e = fe,
            D = E.reduce((e, t) => {
              var n = t + `Error`;
              function r(e, r) {
                (this.name = n),
                  e
                    ? typeof e == `string`
                      ? ((this.message = `${e}${
                          r
                            ? `
 ` + r
                            : ``
                        }`),
                        (this.inner = r || null))
                      : typeof e == `object` &&
                        ((this.message = `${e.name} ${e.message}`),
                        (this.inner = e))
                    : ((this.message = de[t] || n), (this.inner = null));
              }
              return p(r).from(_e), (e[t] = r), e;
            }, {}),
            ve =
              ((D.Syntax = SyntaxError),
              (D.Type = TypeError),
              (D.Range = RangeError),
              w.reduce((e, t) => ((e[t + `Error`] = D[t]), e), {}));
          w = E.reduce(
            (e, t) => (
              [`Syntax`, `Type`, `Range`].indexOf(t) === -1 &&
                (e[t + `Error`] = D[t]),
              e
            ),
            {},
          );
          function O() {}
          function ye(e) {
            return e;
          }
          function be(e, t) {
            return e == null || e === ye ? t : (n) => t(e(n));
          }
          function xe(e, t) {
            return function () {
              e.apply(this, arguments), t.apply(this, arguments);
            };
          }
          function Se(e, t) {
            return e === O
              ? t
              : function () {
                  var n = e.apply(this, arguments),
                    r = (n !== void 0 && (arguments[0] = n), this.onsuccess),
                    i = this.onerror,
                    a =
                      ((this.onsuccess = null),
                      (this.onerror = null),
                      t.apply(this, arguments));
                  return (
                    r &&
                      (this.onsuccess = this.onsuccess
                        ? xe(r, this.onsuccess)
                        : r),
                    i &&
                      (this.onerror = this.onerror ? xe(i, this.onerror) : i),
                    a === void 0 ? n : a
                  );
                };
          }
          function Ce(e, t) {
            return e === O
              ? t
              : function () {
                  e.apply(this, arguments);
                  var n = this.onsuccess,
                    r = this.onerror;
                  (this.onsuccess = this.onerror = null),
                    t.apply(this, arguments),
                    n &&
                      (this.onsuccess = this.onsuccess
                        ? xe(n, this.onsuccess)
                        : n),
                    r &&
                      (this.onerror = this.onerror ? xe(r, this.onerror) : r);
                };
          }
          function we(e, t) {
            return e === O
              ? t
              : function (n) {
                  var r = e.apply(this, arguments),
                    n = (o(n, r), this.onsuccess),
                    i = this.onerror,
                    a =
                      ((this.onsuccess = null),
                      (this.onerror = null),
                      t.apply(this, arguments));
                  return (
                    n &&
                      (this.onsuccess = this.onsuccess
                        ? xe(n, this.onsuccess)
                        : n),
                    i &&
                      (this.onerror = this.onerror ? xe(i, this.onerror) : i),
                    r === void 0 ? (a === void 0 ? void 0 : a) : o(r, a)
                  );
                };
          }
          function Te(e, t) {
            return e === O
              ? t
              : function () {
                  return (
                    !1 !== t.apply(this, arguments) && e.apply(this, arguments)
                  );
                };
          }
          function Ee(e, t) {
            return e === O
              ? t
              : function () {
                  var n = e.apply(this, arguments);
                  if (n && typeof n.then == `function`) {
                    for (var i = arguments.length, a = Array(i); i--; )
                      a[i] = arguments[i];
                    return n.then(() => t.apply(this, a));
                  }
                  return t.apply(this, arguments);
                };
          }
          (w.ModifyError = me), (w.DexieError = fe), (w.BulkError = he);
          var De =
            typeof location < `u` &&
            /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
          function Oe(e) {
            De = e;
          }
          var ke = {},
            Ae = 100,
            je =
              typeof Promise > `u`
                ? []
                : ((E = Promise.resolve()),
                  typeof crypto < `u` && crypto.subtle
                    ? [
                        (je = crypto.subtle.digest(
                          `SHA-512`,
                          new Uint8Array([0]),
                        )),
                        s(je),
                        E,
                      ]
                    : [E, s(E), E]),
            E = je[0],
            Me = je[1],
            Me = Me && Me.then,
            Ne = E && E.constructor,
            Pe = !!je[2],
            Fe = (e, t) => {
              He.push([e, t]), (Le &&= (queueMicrotask(Ze), !1));
            },
            Ie = !0,
            Le = !0,
            Re = [],
            ze = [],
            Be = ye,
            Ve = {
              id: `global`,
              global: !0,
              ref: 0,
              unhandleds: [],
              onunhandled: O,
              pgp: !1,
              env: {},
              finalize: O,
            },
            k = Ve,
            He = [],
            Ue = 0,
            We = [];
          function A(e) {
            if (typeof this != `object`)
              throw TypeError(`Promises must be constructed via new`);
            (this._listeners = []), (this._lib = !1);
            var t = (this._PSD = k);
            if (typeof e != `function`) {
              if (e !== ke) throw TypeError(`Not a function`);
              (this._state = arguments[1]),
                (this._value = arguments[2]),
                !1 === this._state && qe(this, this._value);
            } else
              (this._state = null),
                (this._value = null),
                ++t.ref,
                (function e(t, n) {
                  try {
                    n(
                      (n) => {
                        if (t._state === null) {
                          if (n === t)
                            throw TypeError(
                              `A promise cannot be resolved with itself.`,
                            );
                          var r = t._lib && Qe();
                          n && typeof n.then == `function`
                            ? e(t, (e, t) => {
                                n instanceof A ? n._then(e, t) : n.then(e, t);
                              })
                            : ((t._state = !0), (t._value = n), Je(t)),
                            r && $e();
                        }
                      },
                      qe.bind(null, t),
                    );
                  } catch (e) {
                    qe(t, e);
                  }
                })(this, e);
          }
          var Ge = {
            get: () => {
              var e = k,
                t = at;
              function n(n, r) {
                var a = !e.global && (e !== k || t !== at),
                  o = a && !lt(),
                  s = new A((t, s) => {
                    Ye(this, new Ke(ht(n, e, a, o), ht(r, e, a, o), t, s, e));
                  });
                return (
                  this._consoleTask && (s._consoleTask = this._consoleTask), s
                );
              }
              return (n.prototype = ke), n;
            },
            set: function (e) {
              f(
                this,
                `then`,
                e && e.prototype === ke ? Ge : { get: () => e, set: Ge.set },
              );
            },
          };
          function Ke(e, t, n, r, i) {
            (this.onFulfilled = typeof e == `function` ? e : null),
              (this.onRejected = typeof t == `function` ? t : null),
              (this.resolve = n),
              (this.reject = r),
              (this.psd = i);
          }
          function qe(e, t) {
            var n, r;
            ze.push(t),
              e._state === null &&
                ((n = e._lib && Qe()),
                (t = Be(t)),
                (e._state = !1),
                (e._value = t),
                (r = e),
                Re.some((e) => e._value === r._value) || Re.push(r),
                Je(e),
                n) &&
                $e();
          }
          function Je(e) {
            var t = e._listeners;
            e._listeners = [];
            for (var n = 0, r = t.length; n < r; ++n) Ye(e, t[n]);
            var i = e._PSD;
            --i.ref || i.finalize(),
              Ue === 0 &&
                (++Ue,
                Fe(() => {
                  --Ue == 0 && et();
                }, []));
          }
          function Ye(e, t) {
            if (e._state === null) e._listeners.push(t);
            else {
              var n = e._state ? t.onFulfilled : t.onRejected;
              if (n === null)
                return (e._state ? t.resolve : t.reject)(e._value);
              ++t.psd.ref, ++Ue, Fe(Xe, [n, e, t]);
            }
          }
          function Xe(e, t, n) {
            try {
              var r,
                i = t._value;
              !t._state && ze.length && (ze = []),
                (r =
                  De && t._consoleTask ? t._consoleTask.run(() => e(i)) : e(i)),
                t._state ||
                  ze.indexOf(i) !== -1 ||
                  ((e) => {
                    for (var t = Re.length; t; )
                      if (Re[--t]._value === e._value) return Re.splice(t, 1);
                  })(t),
                n.resolve(r);
            } catch (e) {
              n.reject(e);
            } finally {
              --Ue == 0 && et(), --n.psd.ref || n.psd.finalize();
            }
          }
          function Ze() {
            mt(Ve, () => {
              Qe() && $e();
            });
          }
          function Qe() {
            var e = Ie;
            return (Le = Ie = !1), e;
          }
          function $e() {
            var e, t, n;
            do
              for (; 0 < He.length; )
                for (e = He, He = [], n = e.length, t = 0; t < n; ++t) {
                  var r = e[t];
                  r[0].apply(null, r[1]);
                }
            while (0 < He.length);
            Le = Ie = !0;
          }
          function et() {
            for (
              var e = Re,
                t =
                  ((Re = []),
                  e.forEach((e) => {
                    e._PSD.onunhandled.call(null, e._value, e);
                  }),
                  We.slice(0)),
                n = t.length;
              n;
            )
              t[--n]();
          }
          function tt(e) {
            return new A(ke, !1, e);
          }
          function j(e, t) {
            var n = k;
            return function () {
              var r = Qe(),
                i = k;
              try {
                return ft(n, !0), e.apply(this, arguments);
              } catch (e) {
                t && t(e);
              } finally {
                ft(i, !1), r && $e();
              }
            };
          }
          u(A.prototype, {
            then: Ge,
            _then: function (e, t) {
              Ye(this, new Ke(null, null, e, t, k));
            },
            catch: function (e) {
              var t, n;
              return arguments.length === 1
                ? this.then(null, e)
                : ((t = e),
                  (n = arguments[1]),
                  typeof t == `function`
                    ? this.then(null, (e) => (e instanceof t ? n : tt)(e))
                    : this.then(null, (e) => (e && e.name === t ? n : tt)(e)));
            },
            finally: function (e) {
              return this.then(
                (t) => A.resolve(e()).then(() => t),
                (t) => A.resolve(e()).then(() => tt(t)),
              );
            },
            timeout: function (e, t) {
              return e < 1 / 0
                ? new A((r, i) => {
                    var a = setTimeout(() => i(new D.Timeout(t)), e);
                    this.then(r, i).finally(clearTimeout.bind(null, a));
                  })
                : this;
            },
          }),
            typeof Symbol < `u` &&
              Symbol.toStringTag &&
              f(A.prototype, Symbol.toStringTag, `Dexie.Promise`),
            (Ve.env = pt()),
            u(A, {
              all: function () {
                var e = T.apply(null, arguments).map(ut);
                return new A((t, n) => {
                  e.length === 0 && t([]);
                  var r = e.length;
                  e.forEach((i, a) =>
                    A.resolve(i).then((n) => {
                      (e[a] = n), --r || t(e);
                    }, n),
                  );
                });
              },
              resolve: (e) =>
                e instanceof A
                  ? e
                  : e && typeof e.then == `function`
                    ? new A((t, n) => {
                        e.then(t, n);
                      })
                    : new A(ke, !0, e),
              reject: tt,
              race: function () {
                var e = T.apply(null, arguments).map(ut);
                return new A((t, n) => {
                  e.map((e) => A.resolve(e).then(t, n));
                });
              },
              PSD: { get: () => k, set: (e) => (k = e) },
              totalEchoes: { get: () => at },
              newPSD: st,
              usePSD: mt,
              scheduler: {
                get: () => Fe,
                set: (e) => {
                  Fe = e;
                },
              },
              rejectionMapper: {
                get: () => Be,
                set: (e) => {
                  Be = e;
                },
              },
              follow: (e, t) =>
                new A((n, r) =>
                  st(
                    (t, n) => {
                      var r = k;
                      (r.unhandleds = []),
                        (r.onunhandled = n),
                        (r.finalize = xe(function () {
                          var e;
                          (e = () => {
                            this.unhandleds.length === 0
                              ? t()
                              : n(this.unhandleds[0]);
                          }),
                            We.push(function t() {
                              e(), We.splice(We.indexOf(t), 1);
                            }),
                            ++Ue,
                            Fe(() => {
                              --Ue == 0 && et();
                            }, []);
                        }, r.finalize)),
                        e();
                    },
                    t,
                    n,
                    r,
                  ),
                ),
            }),
            Ne &&
              (Ne.allSettled &&
                f(A, `allSettled`, function () {
                  var e = T.apply(null, arguments).map(ut);
                  return new A((t) => {
                    e.length === 0 && t([]);
                    var n = e.length,
                      r = Array(n);
                    e.forEach((e, i) =>
                      A.resolve(e)
                        .then(
                          (e) => (r[i] = { status: `fulfilled`, value: e }),
                          (e) => (r[i] = { status: `rejected`, reason: e }),
                        )
                        .then(() => --n || t(r)),
                    );
                  });
                }),
              Ne.any &&
                typeof AggregateError < `u` &&
                f(A, `any`, function () {
                  var e = T.apply(null, arguments).map(ut);
                  return new A((t, n) => {
                    e.length === 0 && n(AggregateError([]));
                    var r = e.length,
                      i = Array(r);
                    e.forEach((e, a) =>
                      A.resolve(e).then(
                        (e) => t(e),
                        (e) => {
                          (i[a] = e), --r || n(AggregateError(i));
                        },
                      ),
                    );
                  });
                }),
              Ne.withResolvers) &&
              (A.withResolvers = Ne.withResolvers);
          var M = { awaits: 0, echoes: 0, id: 0 },
            nt = 0,
            rt = [],
            it = 0,
            at = 0,
            ot = 0;
          function st(e, t, n, r) {
            var i = k,
              a = Object.create(i),
              t =
                ((a.parent = i),
                (a.ref = 0),
                (a.global = !1),
                (a.id = ++ot),
                Ve.env,
                (a.env = Pe
                  ? {
                      Promise: A,
                      PromiseProp: { value: A, configurable: !0, writable: !0 },
                      all: A.all,
                      race: A.race,
                      allSettled: A.allSettled,
                      any: A.any,
                      resolve: A.resolve,
                      reject: A.reject,
                    }
                  : {}),
                t && o(a, t),
                ++i.ref,
                (a.finalize = function () {
                  --this.parent.ref || this.parent.finalize();
                }),
                mt(a, e, n, r));
            return a.ref === 0 && a.finalize(), t;
          }
          function ct() {
            return (M.id ||= ++nt), ++M.awaits, (M.echoes += Ae), M.id;
          }
          function lt() {
            return (
              !!M.awaits &&
              (--M.awaits == 0 && (M.id = 0), (M.echoes = M.awaits * Ae), !0)
            );
          }
          function ut(e) {
            return M.echoes && e && e.constructor === Ne
              ? (ct(),
                e.then(
                  (e) => (lt(), e),
                  (e) => (lt(), N(e)),
                ))
              : e;
          }
          function dt() {
            var e = rt[rt.length - 1];
            rt.pop(), ft(e, !1);
          }
          function ft(e, t) {
            var n,
              i,
              a = k;
            (t ? !M.echoes || (it++ && e === k) : !it || (--it && e === k)) ||
              queueMicrotask(
                t
                  ? ((e) => {
                      ++at,
                        (M.echoes && --M.echoes != 0) ||
                          (M.echoes = M.awaits = M.id = 0),
                        rt.push(k),
                        ft(e, !0);
                    }).bind(null, e)
                  : dt,
              ),
              e !== k &&
                ((k = e), a === Ve && (Ve.env = pt()), Pe) &&
                ((n = Ve.env.Promise), (i = e.env), a.global || e.global) &&
                (Object.defineProperty(r, "Promise", i.PromiseProp),
                (n.all = i.all),
                (n.race = i.race),
                (n.resolve = i.resolve),
                (n.reject = i.reject),
                i.allSettled && (n.allSettled = i.allSettled),
                i.any) &&
                (n.any = i.any);
          }
          function pt() {
            var e = r.Promise;
            return Pe
              ? {
                  Promise: e,
                  PromiseProp: Object.getOwnPropertyDescriptor(r, `Promise`),
                  all: e.all,
                  race: e.race,
                  allSettled: e.allSettled,
                  any: e.any,
                  resolve: e.resolve,
                  reject: e.reject,
                }
              : {};
          }
          function mt(e, t, n, r, i) {
            var a = k;
            try {
              return ft(e, !0), t(n, r, i);
            } finally {
              ft(a, !1);
            }
          }
          function ht(e, t, n, r) {
            return typeof e == `function`
              ? function () {
                  var i = k;
                  n && ct(), ft(t, !0);
                  try {
                    return e.apply(this, arguments);
                  } finally {
                    ft(i, !1), r && queueMicrotask(lt);
                  }
                }
              : e;
          }
          function gt(e) {
            Promise === Ne && M.echoes === 0
              ? it === 0
                ? e()
                : enqueueNativeMicroTask(e)
              : setTimeout(e, 0);
          }
          (`` + Me).indexOf(`[native code]`) === -1 && (ct = lt = O);
          var N = A.reject,
            P = `￿`,
            _t = `Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.`,
            vt = `String expected.`,
            yt = `__dbnames`,
            bt = `readonly`,
            xt = `readwrite`;
          function St(e, t) {
            return e
              ? t
                ? function () {
                    return e.apply(this, arguments) && t.apply(this, arguments);
                  }
                : e
              : t;
          }
          var Ct = {
            type: 3,
            lower: -1 / 0,
            lowerOpen: !1,
            upper: [[]],
            upperOpen: !1,
          };
          function wt(e) {
            return typeof e != `string` || /\./.test(e)
              ? (e) => e
              : (t) => (t[e] === void 0 && e in t && delete (t = re(t))[e], t);
          }
          function Tt() {
            throw D.Type(
              `Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.`,
            );
          }
          function F(e, t) {
            try {
              var n = Et(e),
                r = Et(t);
              if (n !== r)
                return n === `Array`
                  ? 1
                  : r === `Array`
                    ? -1
                    : n === `binary`
                      ? 1
                      : r === `binary`
                        ? -1
                        : n === `string`
                          ? 1
                          : r === `string`
                            ? -1
                            : n === `Date`
                              ? 1
                              : r === `Date`
                                ? -1
                                : NaN;
              switch (n) {
                case `number`:
                case `Date`:
                case `string`:
                  return t < e ? 1 : e < t ? -1 : 0;
                case `binary`:
                  for (
                    var i = Dt(e),
                      a = Dt(t),
                      o = i.length,
                      s = a.length,
                      c = o < s ? o : s,
                      l = 0;
                    l < c;
                    ++l
                  )
                    if (i[l] !== a[l]) return i[l] < a[l] ? -1 : 1;
                  return o === s ? 0 : o < s ? -1 : 1;
                case `Array`:
                  for (
                    var u = e,
                      d = t,
                      f = u.length,
                      p = d.length,
                      m = f < p ? f : p,
                      h = 0;
                    h < m;
                    ++h
                  ) {
                    var g = F(u[h], d[h]);
                    if (g !== 0) return g;
                  }
                  return f === p ? 0 : f < p ? -1 : 1;
              }
            } catch {}
            return NaN;
          }
          function Et(e) {
            var t = typeof e;
            return t == `object` &&
              (ArrayBuffer.isView(e) || (t = ae(e)) === `ArrayBuffer`)
              ? `binary`
              : t;
          }
          function Dt(e) {
            return e instanceof Uint8Array
              ? e
              : ArrayBuffer.isView(e)
                ? new Uint8Array(e.buffer, e.byteOffset, e.byteLength)
                : new Uint8Array(e);
          }
          function Ot(e, t, n) {
            var r = e.schema.yProps;
            return r
              ? (t &&
                  0 < n.numFailures &&
                  (t = t.filter((e, t) => !n.failures[t])),
                Promise.all(
                  r.map(
                    (n) => (
                      (n = n.updatesTable),
                      t
                        ? e.db.table(n).where(`k`).anyOf(t).delete()
                        : e.db.table(n).clear()
                    ),
                  ),
                ).then(() => n))
              : n;
          }
          At.prototype.execute = function (e) {
            var t = this[`@@propmod`];
            if (t.add !== void 0) {
              var r = t.add;
              if (a(r)) return n(n([], a(e) ? e : [], !0), r, !0).sort();
              if (typeof r == `number`) return (Number(e) || 0) + r;
              if (typeof r == `bigint`)
                try {
                  return BigInt(e) + r;
                } catch {
                  return BigInt(0) + r;
                }
              throw TypeError(`Invalid term ${r}`);
            }
            if (t.remove !== void 0) {
              var i = t.remove;
              if (a(i))
                return a(e) ? e.filter((e) => !i.includes(e)).sort() : [];
              if (typeof i == `number`) return Number(e) - i;
              if (typeof i == `bigint`)
                try {
                  return BigInt(e) - i;
                } catch {
                  return BigInt(0) - i;
                }
              throw TypeError(`Invalid subtrahend ${i}`);
            }
            return (
              (r = (r = t.replacePrefix)?.[0]),
              r && typeof e == `string` && e.startsWith(r)
                ? t.replacePrefix[1] + e.substring(r.length)
                : e
            );
          };
          var kt = At;
          function At(e) {
            this[`@@propmod`] = e;
          }
          function jt(e, t) {
            for (var n = i(t), r = n.length, a = !1, o = 0; o < r; ++o) {
              var s = n[o],
                c = t[s],
                l = b(e, s);
              c instanceof kt
                ? (x(e, s, c.execute(l)), (a = !0))
                : l !== c && (x(e, s, c), (a = !0));
            }
            return a;
          }
          (I.prototype._trans = function (e, t, n) {
            var r = this._tx || k.trans,
              i = this.name,
              a =
                De &&
                typeof console < `u` &&
                console.createTask &&
                console.createTask(
                  `Dexie: ${e === `readonly` ? `read` : `write`} ${this.name}`,
                );
            function o(e, n, r) {
              if (r.schema[i]) return t(r.idbtrans, r);
              throw new D.NotFound(`Table ` + i + ` not part of transaction`);
            }
            var s = Qe();
            try {
              var c =
                r && r.db._novip === this.db._novip
                  ? r === k.trans
                    ? r._promise(e, o, n)
                    : st(() => r._promise(e, o, n), {
                        trans: r,
                        transless: k.transless || k,
                      })
                  : (function e(t, n, r, i) {
                      if (
                        t.idbdb &&
                        (t._state.openComplete || k.letThrough || t._vip)
                      ) {
                        var a = t._createTransaction(n, r, t._dbSchema);
                        try {
                          a.create(), (t._state.PR1398_maxLoop = 3);
                        } catch (a) {
                          return a.name === ge.InvalidState &&
                            t.isOpen() &&
                            0 < --t._state.PR1398_maxLoop
                            ? (console.warn(`Dexie: Need to reopen db`),
                              t.close({ disableAutoOpen: !1 }),
                              t.open().then(() => e(t, n, r, i)))
                            : N(a);
                        }
                        return a
                          ._promise(n, (e, t) =>
                            st(() => ((k.trans = a), i(e, t, a))),
                          )
                          .then((e) => {
                            if (n === `readwrite`)
                              try {
                                a.idbtrans.commit();
                              } catch {}
                            return n === `readonly`
                              ? e
                              : a._completion.then(() => e);
                          });
                      }
                      if (t._state.openComplete)
                        return N(new D.DatabaseClosed(t._state.dbOpenError));
                      if (!t._state.isBeingOpened) {
                        if (!t._state.autoOpen)
                          return N(new D.DatabaseClosed());
                        t.open().catch(O);
                      }
                      return t._state.dbReadyPromise.then(() => e(t, n, r, i));
                    })(this.db, e, [this.name], o);
              return (
                a &&
                  ((c._consoleTask = a),
                  (c = c.catch((e) => (console.trace(e), N(e))))),
                c
              );
            } finally {
              s && $e();
            }
          }),
            (I.prototype.get = function (e, t) {
              return e && e.constructor === Object
                ? this.where(e).first(t)
                : e == null
                  ? N(new D.Type(`Invalid argument to Table.get()`))
                  : this._trans(`readonly`, (t) =>
                      this.core
                        .get({ trans: t, key: e })
                        .then((e) => this.hook.reading.fire(e)),
                    ).then(t);
            }),
            (I.prototype.where = function (e) {
              if (typeof e == `string`) return new this.db.WhereClause(this, e);
              if (a(e))
                return new this.db.WhereClause(this, `[${e.join(`+`)}]`);
              var t = i(e);
              if (t.length === 1) return this.where(t[0]).equals(e[t[0]]);
              var n = this.schema.indexes
                .concat(this.schema.primKey)
                .filter((e) => {
                  if (e.compound && t.every((t) => 0 <= e.keyPath.indexOf(t))) {
                    for (var n = 0; n < t.length; ++n)
                      if (t.indexOf(e.keyPath[n]) === -1) return !1;
                    return !0;
                  }
                  return !1;
                })
                .sort((e, t) => e.keyPath.length - t.keyPath.length)[0];
              if (n && this.db._maxKey !== P)
                return (
                  (s = n.keyPath.slice(0, t.length)),
                  this.where(s).equals(s.map((t) => e[t]))
                );
              !n &&
                De &&
                console.warn(
                  `The query ${JSON.stringify(e)} on ${this.name} would benefit from a compound index [${t.join(`+`)}]`,
                );
              var r = this.schema.idxByName;
              function o(e, t) {
                return F(e, t) === 0;
              }
              var s = t.reduce(
                  (t, n) => {
                    var i = t[0],
                      t = t[1],
                      s = r[n],
                      c = e[n];
                    return [
                      i || s,
                      i || !s
                        ? St(
                            t,
                            s && s.multi
                              ? (e) => (
                                  (e = b(e, n)), a(e) && e.some((e) => o(c, e))
                                )
                              : (e) => o(c, b(e, n)),
                          )
                        : t,
                    ];
                  },
                  [null, null],
                ),
                c = s[0],
                s = s[1];
              return c
                ? this.where(c.name).equals(e[c.keyPath]).filter(s)
                : n
                  ? this.filter(s)
                  : this.where(t).equals(``);
            }),
            (I.prototype.filter = function (e) {
              return this.toCollection().and(e);
            }),
            (I.prototype.count = function (e) {
              return this.toCollection().count(e);
            }),
            (I.prototype.offset = function (e) {
              return this.toCollection().offset(e);
            }),
            (I.prototype.limit = function (e) {
              return this.toCollection().limit(e);
            }),
            (I.prototype.each = function (e) {
              return this.toCollection().each(e);
            }),
            (I.prototype.toArray = function (e) {
              return this.toCollection().toArray(e);
            }),
            (I.prototype.toCollection = function () {
              return new this.db.Collection(new this.db.WhereClause(this));
            }),
            (I.prototype.orderBy = function (e) {
              return new this.db.Collection(
                new this.db.WhereClause(this, a(e) ? `[${e.join(`+`)}]` : e),
              );
            }),
            (I.prototype.reverse = function () {
              return this.toCollection().reverse();
            }),
            (I.prototype.mapToClass = function (t) {
              for (
                var n = this.db,
                  r = this.name,
                  i =
                    ((this.schema.mappedClass = t).prototype instanceof Tt &&
                      (t = ((t) => {
                        var i = s,
                          a = t;
                        if (typeof a != `function` && a !== null)
                          throw TypeError(
                            `Class extends value ` +
                              String(a) +
                              ` is not a constructor or null`,
                          );
                        function o() {
                          this.constructor = i;
                        }
                        function s() {
                          return (
                            (t !== null && t.apply(this, arguments)) || this
                          );
                        }
                        return (
                          e(i, a),
                          (i.prototype =
                            a === null
                              ? Object.create(a)
                              : ((o.prototype = a.prototype), new o())),
                          Object.defineProperty(s.prototype, "db", {
                            get: () => n,
                            enumerable: !1,
                            configurable: !0,
                          }),
                          (s.prototype.table = () => r),
                          s
                        );
                      })(t)),
                    new Set()),
                  a = t.prototype;
                a;
                a = s(a)
              )
                Object.getOwnPropertyNames(a).forEach((e) => i.add(e));
              function o(e) {
                if (!e) return e;
                var n,
                  r = Object.create(t.prototype);
                for (n in e)
                  if (!i.has(n))
                    try {
                      r[n] = e[n];
                    } catch {}
                return r;
              }
              return (
                this.schema.readHook &&
                  this.hook.reading.unsubscribe(this.schema.readHook),
                (this.schema.readHook = o),
                this.hook(`reading`, o),
                t
              );
            }),
            (I.prototype.defineClass = function () {
              return this.mapToClass(function (e) {
                o(this, e);
              });
            }),
            (I.prototype.add = function (e, t) {
              var r = this.schema.primKey,
                i = r.auto,
                a = r.keyPath,
                o = e;
              return (
                a && i && (o = wt(a)(e)),
                this._trans(`readwrite`, (e) =>
                  this.core.mutate({
                    trans: e,
                    type: `add`,
                    keys: t == null ? null : [t],
                    values: [o],
                  }),
                )
                  .then((e) =>
                    e.numFailures ? A.reject(e.failures[0]) : e.lastResult,
                  )
                  .then((t) => {
                    if (a)
                      try {
                        x(e, a, t);
                      } catch {}
                    return t;
                  })
              );
            }),
            (I.prototype.upsert = function (e, t) {
              var r = this.schema.primKey.keyPath;
              return this._trans(`readwrite`, (i) =>
                this.core.get({ trans: i, key: e }).then((a) => {
                  var o = a ?? {};
                  return (
                    jt(o, t),
                    r && x(o, r, e),
                    this.core
                      .mutate({
                        trans: i,
                        type: `put`,
                        values: [o],
                        keys: [e],
                        upsert: !0,
                        updates: { keys: [e], changeSpecs: [t] },
                      })
                      .then((e) =>
                        e.numFailures ? A.reject(e.failures[0]) : !!a,
                      )
                  );
                }),
              );
            }),
            (I.prototype.update = function (e, t) {
              return typeof e != `object` || a(e)
                ? this.where(`:id`).equals(e).modify(t)
                : (e = b(e, this.schema.primKey.keyPath)) === void 0
                  ? N(
                      new D.InvalidArgument(
                        `Given object does not contain its primary key`,
                      ),
                    )
                  : this.where(`:id`).equals(e).modify(t);
            }),
            (I.prototype.put = function (e, t) {
              var r = this.schema.primKey,
                i = r.auto,
                a = r.keyPath,
                o = e;
              return (
                a && i && (o = wt(a)(e)),
                this._trans(`readwrite`, (e) =>
                  this.core.mutate({
                    trans: e,
                    type: `put`,
                    values: [o],
                    keys: t == null ? null : [t],
                  }),
                )
                  .then((e) =>
                    e.numFailures ? A.reject(e.failures[0]) : e.lastResult,
                  )
                  .then((t) => {
                    if (a)
                      try {
                        x(e, a, t);
                      } catch {}
                    return t;
                  })
              );
            }),
            (I.prototype.delete = function (e) {
              return this._trans(`readwrite`, (n) =>
                this.core
                  .mutate({ trans: n, type: `delete`, keys: [e] })
                  .then((n) => Ot(this, [e], n))
                  .then((e) =>
                    e.numFailures ? A.reject(e.failures[0]) : void 0,
                  ),
              );
            }),
            (I.prototype.clear = function () {
              return this._trans(`readwrite`, (t) =>
                this.core
                  .mutate({ trans: t, type: `deleteRange`, range: Ct })
                  .then((t) => Ot(this, null, t)),
              ).then((e) => (e.numFailures ? A.reject(e.failures[0]) : void 0));
            }),
            (I.prototype.bulkGet = function (e) {
              return this._trans(`readonly`, (n) =>
                this.core
                  .getMany({ keys: e, trans: n })
                  .then((e) => e.map((e) => this.hook.reading.fire(e))),
              );
            }),
            (I.prototype.bulkAdd = function (e, t, n) {
              var i = Array.isArray(t) ? t : void 0,
                a = (n ||= i ? void 0 : t) ? n.allKeys : void 0;
              return this._trans(`readwrite`, (t) => {
                var n = this.schema.primKey,
                  o = n.auto,
                  n = n.keyPath;
                if (n && i)
                  throw new D.InvalidArgument(
                    `bulkAdd(): keys argument invalid on tables with inbound keys`,
                  );
                if (i && i.length !== e.length)
                  throw new D.InvalidArgument(
                    `Arguments objects and keys must have the same length`,
                  );
                var s = e.length,
                  o = n && o ? e.map(wt(n)) : e;
                return this.core
                  .mutate({
                    trans: t,
                    type: `add`,
                    keys: i,
                    values: o,
                    wantResults: a,
                  })
                  .then((e) => {
                    var t = e.numFailures,
                      n = e.failures;
                    if (t === 0) return a ? e.results : e.lastResult;
                    throw new he(
                      `${this.name}.bulkAdd(): ${t} of ${s} operations failed`,
                      n,
                    );
                  });
              });
            }),
            (I.prototype.bulkPut = function (e, t, n) {
              var i = Array.isArray(t) ? t : void 0,
                a = (n ||= i ? void 0 : t) ? n.allKeys : void 0;
              return this._trans(`readwrite`, (t) => {
                var n = this.schema.primKey,
                  o = n.auto,
                  n = n.keyPath;
                if (n && i)
                  throw new D.InvalidArgument(
                    `bulkPut(): keys argument invalid on tables with inbound keys`,
                  );
                if (i && i.length !== e.length)
                  throw new D.InvalidArgument(
                    `Arguments objects and keys must have the same length`,
                  );
                var s = e.length,
                  o = n && o ? e.map(wt(n)) : e;
                return this.core
                  .mutate({
                    trans: t,
                    type: `put`,
                    keys: i,
                    values: o,
                    wantResults: a,
                  })
                  .then((e) => {
                    var t = e.numFailures,
                      n = e.failures;
                    if (t === 0) return a ? e.results : e.lastResult;
                    throw new he(
                      `${this.name}.bulkPut(): ${t} of ${s} operations failed`,
                      n,
                    );
                  });
              });
            }),
            (I.prototype.bulkUpdate = function (e) {
              var n = this.core,
                r = e.map((e) => e.key),
                i = e.map((e) => e.changes),
                a = [];
              return this._trans(`readwrite`, (o) =>
                n.getMany({ trans: o, keys: r, cache: `clone` }).then((s) => {
                  var c = [],
                    l = [],
                    u =
                      (e.forEach((e, n) => {
                        var r = e.key,
                          i = e.changes,
                          o = s[n];
                        if (o) {
                          for (
                            var u = 0, d = Object.keys(i);
                            u < d.length;
                            u++
                          ) {
                            var f = d[u],
                              p = i[f];
                            if (f === this.schema.primKey.keyPath) {
                              if (F(p, r) !== 0)
                                throw new D.Constraint(
                                  `Cannot update primary key in bulkUpdate()`,
                                );
                            } else x(o, f, p);
                          }
                          a.push(n), c.push(r), l.push(o);
                        }
                      }),
                      c.length);
                  return n
                    .mutate({
                      trans: o,
                      type: `put`,
                      keys: c,
                      values: l,
                      updates: { keys: r, changeSpecs: i },
                    })
                    .then((e) => {
                      var n = e.numFailures,
                        r = e.failures;
                      if (n === 0) return u;
                      for (var i = 0, o = Object.keys(r); i < o.length; i++) {
                        var s,
                          c = o[i],
                          l = a[Number(c)];
                        l != null && ((s = r[c]), delete r[c], (r[l] = s));
                      }
                      throw new he(
                        `${this.name}.bulkUpdate(): ${n} of ${u} operations failed`,
                        r,
                      );
                    });
                }),
              );
            }),
            (I.prototype.bulkDelete = function (e) {
              var n = e.length;
              return this._trans(`readwrite`, (n) =>
                this.core
                  .mutate({ trans: n, type: `delete`, keys: e })
                  .then((n) => Ot(this, e, n)),
              ).then((e) => {
                var r = e.numFailures,
                  i = e.failures;
                if (r === 0) return e.lastResult;
                throw new he(
                  `${this.name}.bulkDelete(): ${r} of ${n} operations failed`,
                  i,
                );
              });
            });
          var Mt = I;
          function I() {}
          function L(e) {
            function t(t, r) {
              if (r) {
                for (var i = arguments.length, a = Array(i - 1); --i; )
                  a[i - 1] = arguments[i];
                return n[t].subscribe.apply(null, a), e;
              }
              if (typeof t == `string`) return n[t];
            }
            var n = {};
            t.addEventType = s;
            for (var r = 1, o = arguments.length; r < o; ++r) s(arguments[r]);
            return t;
            function s(e, r, o) {
              var c, l;
              if (typeof e != `object`)
                return (
                  (r ||= Te),
                  (l = {
                    subscribers: [],
                    fire: (o ||= O),
                    subscribe: (e) => {
                      l.subscribers.indexOf(e) === -1 &&
                        (l.subscribers.push(e), (l.fire = r(l.fire, e)));
                    },
                    unsubscribe: (e) => {
                      (l.subscribers = l.subscribers.filter((t) => t !== e)),
                        (l.fire = l.subscribers.reduce(r, o));
                    },
                  }),
                  (n[e] = t[e] = l)
                );
              i((c = e)).forEach((e) => {
                var t = c[e];
                if (a(t)) s(e, c[e][0], c[e][1]);
                else {
                  if (t !== `asap`)
                    throw new D.InvalidArgument(`Invalid event config`);
                  var n = s(e, ye, function () {
                    for (var e = arguments.length, t = Array(e); e--; )
                      t[e] = arguments[e];
                    n.subscribers.forEach((e) => {
                      y(() => {
                        e.apply(null, t);
                      });
                    });
                  });
                }
              });
            }
          }
          function Nt(e, t) {
            return p(t).from({ prototype: e }), t;
          }
          function R(e, t) {
            return (
              !(e.filter || e.algorithm || e.or) &&
              (t ? e.justLimit : !e.replayFilter)
            );
          }
          function Pt(e, t) {
            e.filter = St(e.filter, t);
          }
          function Ft(e, t, n) {
            var r = e.replayFilter;
            (e.replayFilter = r ? () => St(r(), t()) : t),
              (e.justLimit = n && !r);
          }
          function It(e, t) {
            if (e.isPrimKey) return t.primaryKey;
            var n = t.getIndexByKeyPath(e.index);
            if (n) return n;
            throw new D.Schema(
              `KeyPath ` +
                e.index +
                ` on object store ` +
                t.name +
                ` is not indexed`,
            );
          }
          function Lt(e, t, n) {
            var r = It(e, t.schema);
            return t.openCursor({
              trans: n,
              values: !e.keysOnly,
              reverse: e.dir === `prev`,
              unique: !!e.unique,
              query: { index: r, range: e.range },
            });
          }
          function Rt(e, t, n, r) {
            var i,
              a,
              o = e.replayFilter ? St(e.filter, e.replayFilter()) : e.filter;
            return e.or
              ? ((i = {}),
                (a = (e, n, r) => {
                  var a, s;
                  (o &&
                    !o(
                      n,
                      r,
                      (e) => n.stop(e),
                      (e) => n.fail(e),
                    )) ||
                    ((s = `` + (a = n.primaryKey)) == `[object ArrayBuffer]` &&
                      (s = `` + new Uint8Array(a)),
                    l(i, s)) ||
                    ((i[s] = !0), t(e, n, r));
                }),
                Promise.all([
                  e.or._iterate(a, n),
                  zt(Lt(e, r, n), e.algorithm, a, !e.keysOnly && e.valueMapper),
                ]))
              : zt(
                  Lt(e, r, n),
                  St(e.algorithm, o),
                  t,
                  !e.keysOnly && e.valueMapper,
                );
          }
          function zt(e, t, n, r) {
            var i = j(r ? (e, t, i) => n(r(e), t, i) : n);
            return e.then((e) => {
              if (e)
                return e.start(() => {
                  var n = () => e.continue();
                  (t &&
                    !t(
                      e,
                      (e) => (n = e),
                      (t) => {
                        e.stop(t), (n = O);
                      },
                      (t) => {
                        e.fail(t), (n = O);
                      },
                    )) ||
                    i(e.value, e, (e) => (n = e)),
                    n();
                });
            });
          }
          (z.prototype._read = function (e, t) {
            var n = this._ctx;
            return n.error
              ? n.table._trans(null, N.bind(null, n.error))
              : n.table._trans(`readonly`, e).then(t);
          }),
            (z.prototype._write = function (e) {
              var t = this._ctx;
              return t.error
                ? t.table._trans(null, N.bind(null, t.error))
                : t.table._trans(`readwrite`, e, `locked`);
            }),
            (z.prototype._addAlgorithm = function (e) {
              var t = this._ctx;
              t.algorithm = St(t.algorithm, e);
            }),
            (z.prototype._iterate = function (e, t) {
              return Rt(this._ctx, e, t, this._ctx.table.core);
            }),
            (z.prototype.clone = function (e) {
              var t = Object.create(this.constructor.prototype),
                n = Object.create(this._ctx);
              return e && o(n, e), (t._ctx = n), t;
            }),
            (z.prototype.raw = function () {
              return (this._ctx.valueMapper = null), this;
            }),
            (z.prototype.each = function (e) {
              var t = this._ctx;
              return this._read((n) => Rt(t, e, n, t.table.core));
            }),
            (z.prototype.count = function (e) {
              return this._read((e) => {
                var n,
                  r = this._ctx,
                  i = r.table.core;
                return R(r, !0)
                  ? i
                      .count({
                        trans: e,
                        query: { index: It(r, i.schema), range: r.range },
                      })
                      .then((e) => Math.min(e, r.limit))
                  : ((n = 0), Rt(r, () => (++n, !1), e, i).then(() => n));
              }).then(e);
            }),
            (z.prototype.sortBy = function (e, t) {
              var n = e.split(`.`).reverse(),
                r = n[0],
                i = n.length - 1;
              function a(e, t) {
                return t ? a(e[n[t]], t - 1) : e[r];
              }
              var o = this._ctx.dir === `next` ? 1 : -1;
              function s(e, t) {
                return F(a(e, i), a(t, i)) * o;
              }
              return this.toArray((e) => e.slice().sort(s)).then(t);
            }),
            (z.prototype.toArray = function (e) {
              return this._read((e) => {
                var n,
                  r,
                  i,
                  a = this._ctx;
                return R(a, !0) && 0 < a.limit
                  ? ((n = a.valueMapper),
                    (r = It(a, a.table.core.schema)),
                    a.table.core
                      .query({
                        trans: e,
                        limit: a.limit,
                        values: !0,
                        direction: a.dir === `prev` ? `prev` : void 0,
                        query: { index: r, range: a.range },
                      })
                      .then((e) => ((e = e.result), n ? e.map(n) : e)))
                  : ((i = []),
                    Rt(a, (e) => i.push(e), e, a.table.core).then(() => i));
              }, e);
            }),
            (z.prototype.offset = function (e) {
              var t = this._ctx;
              return (
                e <= 0 ||
                  ((t.offset += e),
                  R(t)
                    ? Ft(t, () => {
                        var t = e;
                        return (e, n) =>
                          t === 0 ||
                          (t === 1
                            ? --t
                            : n(() => {
                                e.advance(t), (t = 0);
                              }),
                          !1);
                      })
                    : Ft(t, () => {
                        var t = e;
                        return () => --t < 0;
                      })),
                this
              );
            }),
            (z.prototype.limit = function (e) {
              return (
                (this._ctx.limit = Math.min(this._ctx.limit, e)),
                Ft(
                  this._ctx,
                  () => {
                    var t = e;
                    return (e, n, r) => (--t <= 0 && n(r), 0 <= t);
                  },
                  !0,
                ),
                this
              );
            }),
            (z.prototype.until = function (e, t) {
              return Pt(this._ctx, (n, r, i) => !e(n.value) || (r(i), t)), this;
            }),
            (z.prototype.first = function (e) {
              return this.limit(1)
                .toArray((e) => e[0])
                .then(e);
            }),
            (z.prototype.last = function (e) {
              return this.reverse().first(e);
            }),
            (z.prototype.filter = function (e) {
              var t;
              return (
                Pt(this._ctx, (t) => e(t.value)),
                ((t = this._ctx).isMatch = St(t.isMatch, e)),
                this
              );
            }),
            (z.prototype.and = function (e) {
              return this.filter(e);
            }),
            (z.prototype.or = function (e) {
              return new this.db.WhereClause(this._ctx.table, e, this);
            }),
            (z.prototype.reverse = function () {
              return (
                (this._ctx.dir = this._ctx.dir === `prev` ? `next` : `prev`),
                this._ondirectionchange &&
                  this._ondirectionchange(this._ctx.dir),
                this
              );
            }),
            (z.prototype.desc = function () {
              return this.reverse();
            }),
            (z.prototype.eachKey = function (e) {
              var t = this._ctx;
              return (
                (t.keysOnly = !t.isMatch),
                this.each((t, n) => {
                  e(n.key, n);
                })
              );
            }),
            (z.prototype.eachUniqueKey = function (e) {
              return (this._ctx.unique = `unique`), this.eachKey(e);
            }),
            (z.prototype.eachPrimaryKey = function (e) {
              var t = this._ctx;
              return (
                (t.keysOnly = !t.isMatch),
                this.each((t, n) => {
                  e(n.primaryKey, n);
                })
              );
            }),
            (z.prototype.keys = function (e) {
              var t = this._ctx,
                n = ((t.keysOnly = !t.isMatch), []);
              return this.each((e, t) => {
                n.push(t.key);
              })
                .then(() => n)
                .then(e);
            }),
            (z.prototype.primaryKeys = function (e) {
              var t = this._ctx;
              if (R(t, !0) && 0 < t.limit)
                return this._read((e) => {
                  var n = It(t, t.table.core.schema);
                  return t.table.core.query({
                    trans: e,
                    values: !1,
                    limit: t.limit,
                    direction: t.dir === `prev` ? `prev` : void 0,
                    query: { index: n, range: t.range },
                  });
                })
                  .then((e) => e.result)
                  .then(e);
              t.keysOnly = !t.isMatch;
              var n = [];
              return this.each((e, t) => {
                n.push(t.primaryKey);
              })
                .then(() => n)
                .then(e);
            }),
            (z.prototype.uniqueKeys = function (e) {
              return (this._ctx.unique = `unique`), this.keys(e);
            }),
            (z.prototype.firstKey = function (e) {
              return this.limit(1)
                .keys((e) => e[0])
                .then(e);
            }),
            (z.prototype.lastKey = function (e) {
              return this.reverse().firstKey(e);
            }),
            (z.prototype.distinct = function () {
              var e,
                t = this._ctx,
                t = t.index && t.table.schema.idxByName[t.index];
              return (
                t &&
                  t.multi &&
                  ((e = {}),
                  Pt(this._ctx, (t) => {
                    var t = t.primaryKey.toString(),
                      n = l(e, t);
                    return (e[t] = !0), !n;
                  })),
                this
              );
            }),
            (z.prototype.modify = function (e) {
              var n = this._ctx;
              return this._write((r) => {
                function a(e, t) {
                  var n = t.failures;
                  p += e - t.numFailures;
                  for (var r = 0, a = i(n); r < a.length; r++) {
                    var o = a[r];
                    f.push(n[o]);
                  }
                }
                var o = typeof e == `function` ? e : (t) => jt(t, e),
                  s = n.table.core,
                  c = s.schema.primaryKey,
                  l = c.outbound,
                  u = c.extractKey,
                  d = 200,
                  c = this.db._options.modifyChunkSize,
                  f =
                    (c &&
                      (d =
                        typeof c == `object` ? c[s.name] || c[`*`] || 200 : c),
                    []),
                  p = 0,
                  m = [],
                  h = e === Vt;
                return this.clone()
                  .primaryKeys()
                  .then((t) => {
                    function i(f) {
                      var p = Math.min(d, t.length - f),
                        m = t.slice(f, f + p);
                      return (
                        h
                          ? Promise.resolve([])
                          : s.getMany({ trans: r, keys: m, cache: `immutable` })
                      ).then((g) => {
                        var _ = [],
                          v = [],
                          y = l ? [] : null,
                          b = h ? m : [];
                        if (!h)
                          for (var x = 0; x < p; ++x) {
                            var ee = g[x],
                              S = { value: re(ee), primKey: t[f + x] };
                            !1 !== o.call(S, S.value, S) &&
                              (S.value == null
                                ? b.push(t[f + x])
                                : l || F(u(ee), u(S.value)) === 0
                                  ? (v.push(S.value), l && y.push(t[f + x]))
                                  : (b.push(t[f + x]), _.push(S.value)));
                          }
                        return Promise.resolve(
                          0 < _.length &&
                            s
                              .mutate({ trans: r, type: `add`, values: _ })
                              .then((e) => {
                                for (var t in e.failures)
                                  b.splice(parseInt(t), 1);
                                a(_.length, e);
                              }),
                        )
                          .then(
                            () =>
                              (0 < v.length || (c && typeof e == `object`)) &&
                              s
                                .mutate({
                                  trans: r,
                                  type: `put`,
                                  keys: y,
                                  values: v,
                                  criteria: c,
                                  changeSpec: typeof e != `function` && e,
                                  isAdditionalChunk: 0 < f,
                                })
                                .then((e) => a(v.length, e)),
                          )
                          .then(
                            () =>
                              (0 < b.length || (c && h)) &&
                              s
                                .mutate({
                                  trans: r,
                                  type: `delete`,
                                  keys: b,
                                  criteria: c,
                                  isAdditionalChunk: 0 < f,
                                })
                                .then((e) => Ot(n.table, b, e))
                                .then((e) => a(b.length, e)),
                          )
                          .then(() => t.length > f + p && i(f + d));
                      });
                    }
                    var c = R(n) &&
                      n.limit === 1 / 0 &&
                      (typeof e != `function` || h) && {
                        index: n.index,
                        range: n.range,
                      };
                    return i(0).then(() => {
                      if (0 < f.length)
                        throw new me(
                          `Error modifying one or more objects`,
                          f,
                          p,
                          m,
                        );
                      return t.length;
                    });
                  });
              });
            }),
            (z.prototype.delete = function () {
              var e = this._ctx,
                t = e.range;
              return !R(e) ||
                e.table.schema.yProps ||
                (!e.isPrimKey && t.type !== 3)
                ? this.modify(Vt)
                : this._write((n) => {
                    var r = e.table.core.schema.primaryKey,
                      i = t;
                    return e.table.core
                      .count({ trans: n, query: { index: r, range: i } })
                      .then((t) =>
                        e.table.core
                          .mutate({ trans: n, type: `deleteRange`, range: i })
                          .then((e) => {
                            var n = e.failures,
                              e = e.numFailures;
                            if (e)
                              throw new me(
                                `Could not delete some values`,
                                Object.keys(n).map((e) => n[e]),
                                t - e,
                              );
                            return t - e;
                          }),
                      );
                  });
            });
          var Bt = z;
          function z() {}
          var Vt = (e, t) => (t.value = null);
          function Ht(e, t) {
            return e < t ? -1 : e === t ? 0 : 1;
          }
          function Ut(e, t) {
            return t < e ? -1 : e === t ? 0 : 1;
          }
          function B(e, t, n) {
            return (
              (e = e instanceof Jt ? new e.Collection(e) : e),
              (e._ctx.error = new (n || TypeError)(t)),
              e
            );
          }
          function Wt(e) {
            return new e.Collection(e, () => qt(``)).limit(0);
          }
          function Gt(e, t, n, r) {
            var i,
              a,
              o,
              s,
              c,
              l,
              u,
              d = n.length;
            if (!n.every((e) => typeof e == `string`)) return B(e, vt);
            function f(e) {
              (i =
                e === `next` ? (e) => e.toUpperCase() : (e) => e.toLowerCase()),
                (a =
                  e === `next`
                    ? (e) => e.toLowerCase()
                    : (e) => e.toUpperCase()),
                (o = e === `next` ? Ht : Ut);
              var t = n
                .map((e) => ({ lower: a(e), upper: i(e) }))
                .sort((e, t) => o(e.lower, t.lower));
              (s = t.map((e) => e.upper)),
                (c = t.map((e) => e.lower)),
                (u = (l = e) === `next` ? `` : r);
            }
            f(`next`);
            var e = new e.Collection(e, () => Kt(s[0], c[d - 1] + r)),
              p =
                ((e._ondirectionchange = (e) => {
                  f(e);
                }),
                0);
            return (
              e._addAlgorithm((e, n, r) => {
                var i = e.key;
                if (typeof i == `string`) {
                  var f = a(i);
                  if (t(f, c, p)) return !0;
                  for (var m = null, h = p; h < d; ++h) {
                    var g = ((e, t, n, r, i, a) => {
                      for (
                        var o = Math.min(e.length, r.length), s = -1, c = 0;
                        c < o;
                        ++c
                      ) {
                        var l = t[c];
                        if (l !== r[c])
                          return i(e[c], n[c]) < 0
                            ? e.substr(0, c) + n[c] + n.substr(c + 1)
                            : i(e[c], r[c]) < 0
                              ? e.substr(0, c) + r[c] + n.substr(c + 1)
                              : 0 <= s
                                ? e.substr(0, s) + t[s] + n.substr(s + 1)
                                : null;
                        i(e[c], l) < 0 && (s = c);
                      }
                      return o < r.length && a === `next`
                        ? e + n.substr(e.length)
                        : o < e.length && a === `prev`
                          ? e.substr(0, n.length)
                          : s < 0
                            ? null
                            : e.substr(0, s) + r[s] + n.substr(s + 1);
                    })(i, f, s[h], c[h], o, l);
                    g === null && m === null
                      ? (p = h + 1)
                      : (m === null || 0 < o(m, g)) && (m = g);
                  }
                  n(
                    m === null
                      ? r
                      : () => {
                          e.continue(m + u);
                        },
                  );
                }
                return !1;
              }),
              e
            );
          }
          function Kt(e, t, n, r) {
            return { type: 2, lower: e, upper: t, lowerOpen: n, upperOpen: r };
          }
          function qt(e) {
            return { type: 1, lower: e, upper: e };
          }
          Object.defineProperty(V.prototype, "Collection", {
            get: function () {
              return this._ctx.table.db.Collection;
            },
            enumerable: !1,
            configurable: !0,
          }),
            (V.prototype.between = function (e, t, n, r) {
              (n = !1 !== n), (r = !0 === r);
              try {
                return 0 < this._cmp(e, t) ||
                  (this._cmp(e, t) === 0 && (n || r) && (!n || !r))
                  ? Wt(this)
                  : new this.Collection(this, () => Kt(e, t, !n, !r));
              } catch {
                return B(this, _t);
              }
            }),
            (V.prototype.equals = function (e) {
              return e == null
                ? B(this, _t)
                : new this.Collection(this, () => qt(e));
            }),
            (V.prototype.above = function (e) {
              return e == null
                ? B(this, _t)
                : new this.Collection(this, () => Kt(e, void 0, !0));
            }),
            (V.prototype.aboveOrEqual = function (e) {
              return e == null
                ? B(this, _t)
                : new this.Collection(this, () => Kt(e, void 0, !1));
            }),
            (V.prototype.below = function (e) {
              return e == null
                ? B(this, _t)
                : new this.Collection(this, () => Kt(void 0, e, !1, !0));
            }),
            (V.prototype.belowOrEqual = function (e) {
              return e == null
                ? B(this, _t)
                : new this.Collection(this, () => Kt(void 0, e));
            }),
            (V.prototype.startsWith = function (e) {
              return typeof e == `string`
                ? this.between(e, e + P, !0, !0)
                : B(this, vt);
            }),
            (V.prototype.startsWithIgnoreCase = function (e) {
              return e === ``
                ? this.startsWith(e)
                : Gt(this, (e, t) => e.indexOf(t[0]) === 0, [e], P);
            }),
            (V.prototype.equalsIgnoreCase = function (e) {
              return Gt(this, (e, t) => e === t[0], [e], ``);
            }),
            (V.prototype.anyOfIgnoreCase = function () {
              var e = T.apply(le, arguments);
              return e.length === 0
                ? Wt(this)
                : Gt(this, (e, t) => t.indexOf(e) !== -1, e, ``);
            }),
            (V.prototype.startsWithAnyOfIgnoreCase = function () {
              var e = T.apply(le, arguments);
              return e.length === 0
                ? Wt(this)
                : Gt(this, (e, t) => t.some((t) => e.indexOf(t) === 0), e, P);
            }),
            (V.prototype.anyOf = function () {
              var e,
                t,
                r = T.apply(le, arguments),
                i = this._cmp;
              try {
                r.sort(i);
              } catch {
                return B(this, _t);
              }
              return r.length === 0
                ? Wt(this)
                : (((e = new this.Collection(this, () =>
                    Kt(r[0], r[r.length - 1]),
                  ))._ondirectionchange = (e) => {
                    (i = e === `next` ? this._ascending : this._descending),
                      r.sort(i);
                  }),
                  (t = 0),
                  e._addAlgorithm((e, n, a) => {
                    for (var o = e.key; 0 < i(o, r[t]); )
                      if (++t === r.length) return n(a), !1;
                    return (
                      i(o, r[t]) === 0 ||
                      (n(() => {
                        e.continue(r[t]);
                      }),
                      !1)
                    );
                  }),
                  e);
            }),
            (V.prototype.notEqual = function (e) {
              return this.inAnyRange(
                [
                  [-1 / 0, e],
                  [e, this.db._maxKey],
                ],
                { includeLowers: !1, includeUppers: !1 },
              );
            }),
            (V.prototype.noneOf = function () {
              var e = T.apply(le, arguments);
              if (e.length === 0) return new this.Collection(this);
              try {
                e.sort(this._ascending);
              } catch {
                return B(this, _t);
              }
              var t = e.reduce(
                (e, t) =>
                  e ? e.concat([[e[e.length - 1][1], t]]) : [[-1 / 0, t]],
                null,
              );
              return (
                t.push([e[e.length - 1], this.db._maxKey]),
                this.inAnyRange(t, { includeLowers: !1, includeUppers: !1 })
              );
            }),
            (V.prototype.inAnyRange = function (e, t) {
              var r = this._cmp,
                i = this._ascending,
                a = this._descending,
                o = this._min,
                s = this._max;
              if (e.length === 0) return Wt(this);
              if (
                !e.every(
                  (e) =>
                    e[0] !== void 0 && e[1] !== void 0 && i(e[0], e[1]) <= 0,
                )
              )
                return B(
                  this,
                  `First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower`,
                  D.InvalidArgument,
                );
              var c = !t || !1 !== t.includeLowers,
                l = t && !0 === t.includeUppers,
                u,
                d = i;
              function f(e, t) {
                return d(e[0], t[0]);
              }
              try {
                (u = e.reduce((e, t) => {
                  for (var n = 0, i = e.length; n < i; ++n) {
                    var a = e[n];
                    if (r(t[0], a[1]) < 0 && 0 < r(t[1], a[0])) {
                      (a[0] = o(a[0], t[0])), (a[1] = s(a[1], t[1]));
                      break;
                    }
                  }
                  return n === i && e.push(t), e;
                }, [])).sort(f);
              } catch {
                return B(this, _t);
              }
              var p = 0,
                m = l ? (e) => 0 < i(e, u[p][1]) : (e) => 0 <= i(e, u[p][1]),
                h = c ? (e) => 0 < a(e, u[p][0]) : (e) => 0 <= a(e, u[p][0]),
                g = m,
                t = new this.Collection(this, () =>
                  Kt(u[0][0], u[u.length - 1][1], !c, !l),
                );
              return (
                (t._ondirectionchange = (e) => {
                  (d = e === `next` ? ((g = m), i) : ((g = h), a)), u.sort(f);
                }),
                t._addAlgorithm((e, t, r) => {
                  for (var a, o = e.key; g(o); )
                    if (++p === u.length) return t(r), !1;
                  return (
                    (!m((a = o)) && !h(a)) ||
                    (this._cmp(o, u[p][1]) === 0 ||
                      this._cmp(o, u[p][0]) === 0 ||
                      t(() => {
                        d === i ? e.continue(u[p][0]) : e.continue(u[p][1]);
                      }),
                    !1)
                  );
                }),
                t
              );
            }),
            (V.prototype.startsWithAnyOf = function () {
              var e = T.apply(le, arguments);
              return e.every((e) => typeof e == `string`)
                ? e.length === 0
                  ? Wt(this)
                  : this.inAnyRange(e.map((e) => [e, e + P]))
                : B(this, `startsWithAnyOf() only works with strings`);
            });
          var Jt = V;
          function V() {}
          function Yt(e) {
            return j((t) => (Xt(t), e(t.target.error), !1));
          }
          function Xt(e) {
            e.stopPropagation && e.stopPropagation(),
              e.preventDefault && e.preventDefault();
          }
          var Zt = `storagemutated`,
            Qt = `x-storagemutated-1`,
            $t = L(null, Zt),
            en =
              ((tn.prototype._lock = function () {
                return (
                  v(!k.global),
                  ++this._reculock,
                  this._reculock !== 1 || k.global || (k.lockOwnerFor = this),
                  this
                );
              }),
              (tn.prototype._unlock = function () {
                if ((v(!k.global), --this._reculock == 0))
                  for (
                    k.global || (k.lockOwnerFor = null);
                    0 < this._blockedFuncs.length && !this._locked();
                  ) {
                    var e = this._blockedFuncs.shift();
                    try {
                      mt(e[1], e[0]);
                    } catch {}
                  }
                return this;
              }),
              (tn.prototype._locked = function () {
                return this._reculock && k.lockOwnerFor !== this;
              }),
              (tn.prototype.create = function (e) {
                if (this.mode) {
                  var n = this.db.idbdb,
                    r = this.db._state.dbOpenError;
                  if ((v(!this.idbtrans), !e && !n))
                    switch (r && r.name) {
                      case `DatabaseClosedError`:
                        throw new D.DatabaseClosed(r);
                      case `MissingAPIError`:
                        throw new D.MissingAPI(r.message, r);
                      default:
                        throw new D.OpenFailed(r);
                    }
                  if (!this.active) throw new D.TransactionInactive();
                  v(this._completion._state === null),
                    ((e = this.idbtrans =
                      e ||
                      (this.db.core || n).transaction(
                        this.storeNames,
                        this.mode,
                        { durability: this.chromeTransactionDurability },
                      )).onerror = j((n) => {
                      Xt(n), this._reject(e.error);
                    })),
                    (e.onabort = j((n) => {
                      Xt(n),
                        this.active && this._reject(new D.Abort(e.error)),
                        (this.active = !1),
                        this.on(`abort`).fire(n);
                    })),
                    (e.oncomplete = j(() => {
                      (this.active = !1),
                        this._resolve(),
                        `mutatedParts` in e &&
                          $t.storagemutated.fire(e.mutatedParts);
                    }));
                }
                return this;
              }),
              (tn.prototype._promise = function (e, t, n) {
                var r;
                return e === `readwrite` && this.mode !== `readwrite`
                  ? N(new D.ReadOnly(`Transaction is readonly`))
                  : this.active
                    ? this._locked()
                      ? new A((r, a) => {
                          this._blockedFuncs.push([
                            () => {
                              this._promise(e, t, n).then(r, a);
                            },
                            k,
                          ]);
                        })
                      : n
                        ? st(() => {
                            var e = new A((e, n) => {
                              this._lock();
                              var r = t(e, n, this);
                              r && r.then && r.then(e, n);
                            });
                            return (
                              e.finally(() => this._unlock()), (e._lib = !0), e
                            );
                          })
                        : (((r = new A((e, n) => {
                            var r = t(e, n, this);
                            r && r.then && r.then(e, n);
                          }))._lib = !0),
                          r)
                    : N(new D.TransactionInactive());
              }),
              (tn.prototype._root = function () {
                return this.parent ? this.parent._root() : this;
              }),
              (tn.prototype.waitFor = function (e) {
                var t,
                  n = this._root(),
                  r = A.resolve(e),
                  i =
                    (n._waitingFor
                      ? (n._waitingFor = n._waitingFor.then(() => r))
                      : ((n._waitingFor = r),
                        (n._waitingQueue = []),
                        (t = n.idbtrans.objectStore(n.storeNames[0])),
                        (function e() {
                          for (++n._spinCount; n._waitingQueue.length; )
                            n._waitingQueue.shift()();
                          n._waitingFor && (t.get(-1 / 0).onsuccess = e);
                        })()),
                    n._waitingFor);
                return new A((e, t) => {
                  r.then(
                    (t) => n._waitingQueue.push(j(e.bind(null, t))),
                    (e) => n._waitingQueue.push(j(t.bind(null, e))),
                  ).finally(() => {
                    n._waitingFor === i && (n._waitingFor = null);
                  });
                });
              }),
              (tn.prototype.abort = function () {
                this.active &&
                  ((this.active = !1),
                  this.idbtrans && this.idbtrans.abort(),
                  this._reject(new D.Abort()));
              }),
              (tn.prototype.table = function (e) {
                var t = (this._memoizedTables ||= {});
                if (l(t, e)) return t[e];
                var n = this.schema[e];
                if (n)
                  return (
                    ((n = new this.db.Table(e, n, this)).core =
                      this.db.core.table(e)),
                    (t[e] = n)
                  );
                throw new D.NotFound(`Table ` + e + ` not part of transaction`);
              }),
              tn);
          function tn() {}
          function nn(e, t, n, r, i, a, o, s) {
            return {
              name: e,
              keyPath: t,
              unique: n,
              multi: r,
              auto: i,
              compound: a,
              src:
                (n && !o ? `&` : ``) + (r ? `*` : ``) + (i ? `++` : ``) + rn(t),
              type: s,
            };
          }
          function rn(e) {
            return typeof e == `string`
              ? e
              : e
                ? `[` + [].join.call(e, `+`) + `]`
                : ``;
          }
          function an(e, t, n) {
            return {
              name: e,
              primKey: t,
              indexes: n,
              mappedClass: null,
              idxByName:
                ((r = (e) => [e.name, e]),
                n.reduce(
                  (e, t, n) => ((t = r(t, n)), t && (e[t[0]] = t[1]), e),
                  {},
                )),
            };
            var r;
          }
          var on = (e) => {
            try {
              return e.only([[]]), (on = () => [[]]), [[]];
            } catch {
              return (on = () => P), P;
            }
          };
          function sn(e) {
            return e == null
              ? () => {}
              : typeof e == `string`
                ? (t = e).split(`.`).length === 1
                  ? (e) => e[t]
                  : (e) => b(e, t)
                : (t) => b(t, e);
            var t;
          }
          function cn(e) {
            return [].slice.call(e);
          }
          var ln = 0;
          function un(e) {
            return e == null
              ? `:id`
              : typeof e == `string`
                ? e
                : `[${e.join(`+`)}]`;
          }
          function dn(e, t, n) {
            function r(e) {
              if (e.type === 3) return null;
              if (e.type === 4)
                throw Error(`Cannot convert never type to IDBKeyRange`);
              var n = e.lower,
                r = e.upper,
                i = e.lowerOpen,
                e = e.upperOpen;
              return n === void 0
                ? r === void 0
                  ? null
                  : t.upperBound(r, !!e)
                : r === void 0
                  ? t.lowerBound(n, !!i)
                  : t.bound(n, r, !!i, !!e);
            }
            function i(e) {
              var t,
                n,
                i = e.name;
              return {
                name: i,
                schema: e,
                mutate: (e) => {
                  var t = e.trans,
                    n = e.type,
                    a = e.keys,
                    o = e.values,
                    s = e.range;
                  return new Promise((e, c) => {
                    e = j(e);
                    var l = t.objectStore(i),
                      u = l.keyPath == null,
                      d = n === `put` || n === `add`;
                    if (!d && n !== `delete` && n !== `deleteRange`)
                      throw Error(`Invalid operation type: ` + n);
                    var f,
                      p = (a || o || { length: 1 }).length;
                    if (a && o && a.length !== o.length)
                      throw Error(
                        `Given keys array must have same length as given values array.`,
                      );
                    if (p === 0)
                      return e({
                        numFailures: 0,
                        failures: {},
                        results: [],
                        lastResult: void 0,
                      });
                    function m(e) {
                      ++_, Xt(e);
                    }
                    var h = [],
                      g = [],
                      _ = 0;
                    if (n === `deleteRange`) {
                      if (s.type === 4)
                        return e({
                          numFailures: _,
                          failures: g,
                          results: [],
                          lastResult: void 0,
                        });
                      s.type === 3
                        ? h.push((f = l.clear()))
                        : h.push((f = l.delete(r(s))));
                    } else {
                      var u = d ? (u ? [o, a] : [o, null]) : [a, null],
                        v = u[0],
                        y = u[1];
                      if (d)
                        for (var b = 0; b < p; ++b)
                          h.push(
                            (f =
                              y && y[b] !== void 0
                                ? l[n](v[b], y[b])
                                : l[n](v[b])),
                          ),
                            (f.onerror = m);
                      else
                        for (b = 0; b < p; ++b)
                          h.push((f = l[n](v[b]))), (f.onerror = m);
                    }
                    function x(t) {
                      (t = t.target.result),
                        h.forEach(
                          (e, t) => e.error != null && (g[t] = e.error),
                        ),
                        e({
                          numFailures: _,
                          failures: g,
                          results: n === `delete` ? a : h.map((e) => e.result),
                          lastResult: t,
                        });
                    }
                    (f.onerror = (e) => {
                      m(e), x(e);
                    }),
                      (f.onsuccess = x);
                  });
                },
                getMany: (e) => {
                  var t = e.trans,
                    n = e.keys;
                  return new Promise((e, r) => {
                    e = j(e);
                    for (
                      var a,
                        o = t.objectStore(i),
                        s = n.length,
                        c = Array(s),
                        l = 0,
                        u = 0,
                        d = (t) => {
                          (t = t.target),
                            (c[t._pos] = t.result),
                            ++u === l && e(c);
                        },
                        f = Yt(r),
                        p = 0;
                      p < s;
                      ++p
                    )
                      n[p] != null &&
                        (((a = o.get(n[p]))._pos = p),
                        (a.onsuccess = d),
                        (a.onerror = f),
                        ++l);
                    l === 0 && e(c);
                  });
                },
                get: (e) => {
                  var t = e.trans,
                    n = e.key;
                  return new Promise((e, r) => {
                    e = j(e);
                    var a = t.objectStore(i).get(n);
                    (a.onsuccess = (t) => e(t.target.result)),
                      (a.onerror = Yt(r));
                  });
                },
                query:
                  ((t = c),
                  (n = l),
                  (e) =>
                    new Promise((a, o) => {
                      a = j(a);
                      var s,
                        c,
                        l,
                        u,
                        d = e.trans,
                        f = e.values,
                        p = e.limit,
                        m = e.query,
                        h = (h = e.direction) ?? `next`,
                        g = p === 1 / 0 ? void 0 : p,
                        _ = m.index,
                        m = m.range,
                        d = d.objectStore(i),
                        d = _.isPrimaryKey ? d : d.index(_.name),
                        _ = r(m);
                      if (p === 0) return a({ result: [] });
                      n
                        ? ((m = { query: _, count: g, direction: h }),
                          ((s = f ? d.getAll(m) : d.getAllKeys(m)).onsuccess = (
                            e,
                          ) => a({ result: e.target.result })),
                          (s.onerror = Yt(o)))
                        : t && h === `next`
                          ? (((s = f
                              ? d.getAll(_, g)
                              : d.getAllKeys(_, g)).onsuccess = (e) =>
                              a({ result: e.target.result })),
                            (s.onerror = Yt(o)))
                          : ((c = 0),
                            (l =
                              !f && `openKeyCursor` in d
                                ? d.openKeyCursor(_, h)
                                : d.openCursor(_, h)),
                            (u = []),
                            (l.onsuccess = () => {
                              var e = l.result;
                              return !e ||
                                (u.push(f ? e.value : e.primaryKey), ++c === p)
                                ? a({ result: u })
                                : void e.continue();
                            }),
                            (l.onerror = Yt(o)));
                    })),
                openCursor: (e) => {
                  var t = e.trans,
                    n = e.values,
                    a = e.query,
                    o = e.reverse,
                    s = e.unique;
                  return new Promise((e, c) => {
                    e = j(e);
                    var l = a.index,
                      u = a.range,
                      d = t.objectStore(i),
                      d = l.isPrimaryKey ? d : d.index(l.name),
                      l = o
                        ? s
                          ? `prevunique`
                          : `prev`
                        : s
                          ? `nextunique`
                          : `next`,
                      f =
                        !n && `openKeyCursor` in d
                          ? d.openKeyCursor(r(u), l)
                          : d.openCursor(r(u), l);
                    (f.onerror = Yt(c)),
                      (f.onsuccess = j((n) => {
                        var r,
                          i,
                          a,
                          o,
                          s = f.result;
                        s
                          ? ((s.___id = ++ln),
                            (s.done = !1),
                            (r = s.continue.bind(s)),
                            (i = (i = s.continuePrimaryKey) && i.bind(s)),
                            (a = s.advance.bind(s)),
                            (o = () => {
                              throw Error(`Cursor not stopped`);
                            }),
                            (s.trans = t),
                            (s.stop =
                              s.continue =
                              s.continuePrimaryKey =
                              s.advance =
                                () => {
                                  throw Error(`Cursor not started`);
                                }),
                            (s.fail = j(c)),
                            (s.next = function () {
                              var t = 1;
                              return this.start(() =>
                                t-- ? this.continue() : this.stop(),
                              ).then(() => this);
                            }),
                            (s.start = (e) => {
                              function t() {
                                if (f.result)
                                  try {
                                    e();
                                  } catch (e) {
                                    s.fail(e);
                                  }
                                else
                                  (s.done = !0),
                                    (s.start = () => {
                                      throw Error(`Cursor behind last entry`);
                                    }),
                                    s.stop();
                              }
                              var n = new Promise((e, t) => {
                                (e = j(e)),
                                  (f.onerror = Yt(t)),
                                  (s.fail = t),
                                  (s.stop = (t) => {
                                    (s.stop =
                                      s.continue =
                                      s.continuePrimaryKey =
                                      s.advance =
                                        o),
                                      e(t);
                                  });
                              });
                              return (
                                (f.onsuccess = j((e) => {
                                  (f.onsuccess = t), t();
                                })),
                                (s.continue = r),
                                (s.continuePrimaryKey = i),
                                (s.advance = a),
                                t(),
                                n
                              );
                            }),
                            e(s))
                          : e(null);
                      }, c));
                  });
                },
                count: (e) => {
                  var t = e.query,
                    n = e.trans,
                    a = t.index,
                    o = t.range;
                  return new Promise((e, t) => {
                    var s = n.objectStore(i),
                      s = a.isPrimaryKey ? s : s.index(a.name),
                      c = r(o),
                      c = c ? s.count(c) : s.count();
                    (c.onsuccess = j((t) => e(t.target.result))),
                      (c.onerror = Yt(t));
                  });
                },
              };
            }
            (o = n),
              (s = cn((n = e).objectStoreNames)),
              (u = 0 < s.length ? o.objectStore(s[0]) : {});
            var o,
              n = {
                schema: {
                  name: n.name,
                  tables: s
                    .map((e) => o.objectStore(e))
                    .map((e) => {
                      var t = e.keyPath,
                        n = e.autoIncrement,
                        r = a(t),
                        i = {},
                        r = {
                          name: e.name,
                          primaryKey: {
                            name: null,
                            isPrimaryKey: !0,
                            outbound: t == null,
                            compound: r,
                            keyPath: t,
                            autoIncrement: n,
                            unique: !0,
                            extractKey: sn(t),
                          },
                          indexes: cn(e.indexNames)
                            .map((t) => e.index(t))
                            .map((e) => {
                              var t = e.name,
                                n = e.unique,
                                r = e.multiEntry,
                                e = e.keyPath,
                                t = {
                                  name: t,
                                  compound: a(e),
                                  keyPath: e,
                                  unique: n,
                                  multiEntry: r,
                                  extractKey: sn(e),
                                };
                              return (i[un(e)] = t);
                            }),
                          getIndexByKeyPath: (e) => i[un(e)],
                        };
                      return (
                        (i[`:id`] = r.primaryKey),
                        t != null && (i[un(t)] = r.primaryKey),
                        r
                      );
                    }),
                },
                hasGetAll:
                  0 < s.length &&
                  `getAll` in u &&
                  !(
                    typeof navigator < `u` &&
                    /Safari/.test(navigator.userAgent) &&
                    !/(Chrome\/|Edge\/)/.test(navigator.userAgent) &&
                    [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] <
                      604
                  ),
                hasIdb3Features: `getAllRecords` in u,
              },
              s = n.schema,
              c = n.hasGetAll,
              l = n.hasIdb3Features,
              u = s.tables.map(i),
              d = {};
            return (
              u.forEach((e) => (d[e.name] = e)),
              {
                stack: `dbcore`,
                transaction: e.transaction.bind(e),
                table: (e) => {
                  if (d[e]) return d[e];
                  throw Error(`Table '${e}' not found`);
                },
                MIN_KEY: -1 / 0,
                MAX_KEY: on(t),
                schema: s,
              }
            );
          }
          function fn(e, n, r, i) {
            return (
              (r = r.IDBKeyRange),
              (n = dn(n, r, i)),
              {
                dbcore: e.dbcore.reduce(
                  (e, n) => ((n = n.create), t(t({}, e), n(e))),
                  n,
                ),
              }
            );
          }
          function pn(e, t) {
            var n = t.db,
              n = fn(e._middlewares, n, e._deps, t);
            (e.core = n.dbcore),
              e.tables.forEach((t) => {
                var n = t.name;
                e.core.schema.tables.some((e) => e.name === n) &&
                  ((t.core = e.core.table(n)), e[n] instanceof e.Table) &&
                  (e[n].core = t.core);
              });
          }
          function mn(e, t, n, r) {
            n.forEach((n) => {
              var i = r[n];
              t.forEach((t) => {
                var r = (function e(t, n) {
                  return m(t, n) || ((t = s(t)) && e(t, n));
                })(t, n);
                (!r || (`value` in r && r.value === void 0)) &&
                  (t === e.Transaction.prototype || t instanceof e.Transaction
                    ? f(t, n, {
                        get: function () {
                          return this.table(n);
                        },
                        set: function (e) {
                          d(this, n, {
                            value: e,
                            writable: !0,
                            configurable: !0,
                            enumerable: !0,
                          });
                        },
                      })
                    : (t[n] = new e.Table(n, i)));
              });
            });
          }
          function hn(e, t) {
            t.forEach((t) => {
              for (var n in t) t[n] instanceof e.Table && delete t[n];
            });
          }
          function gn(e, t) {
            return e._cfg.version - t._cfg.version;
          }
          function _n(e, t, n, r) {
            var a = e._dbSchema,
              o =
                (n.objectStoreNames.contains(`$meta`) &&
                  !a.$meta &&
                  ((a.$meta = an(`$meta`, Tn(``)[0], [])),
                  e._storeNames.push(`$meta`)),
                e._createTransaction(`readwrite`, e._storeNames, a)),
              s = (o.create(n), o._completion.catch(r), o._reject.bind(o)),
              c = k.transless || k;
            st(() => {
              if (((k.trans = o), (k.transless = c), t !== 0))
                return (
                  pn(e, n),
                  (l = t),
                  ((r = o).storeNames.includes(`$meta`)
                    ? r
                        .table(`$meta`)
                        .get(`version`)
                        .then((e) => e ?? l)
                    : A.resolve(l)
                  )
                    .then((t) => {
                      var r = e,
                        a = t,
                        s = o,
                        c = n,
                        l = [],
                        t = r._versions,
                        u = (r._dbSchema = Cn(0, r.idbdb, c));
                      return (t = t.filter((e) => e._cfg.version >= a))
                        .length === 0
                        ? A.resolve()
                        : (t.forEach((e) => {
                            l.push(() => {
                              var t,
                                n,
                                o,
                                l = u,
                                d = e._cfg.dbschema,
                                f =
                                  (wn(r, l, c),
                                  wn(r, d, c),
                                  (u = r._dbSchema = d),
                                  yn(l, d)),
                                p =
                                  (f.add.forEach((e) => {
                                    bn(c, e[0], e[1].primKey, e[1].indexes);
                                  }),
                                  f.change.forEach((e) => {
                                    if (e.recreate)
                                      throw new D.Upgrade(
                                        `Not yet support for changing primary key`,
                                      );
                                    var t = c.objectStore(e.name);
                                    e.add.forEach((e) => Sn(t, e)),
                                      e.change.forEach((e) => {
                                        t.deleteIndex(e.name), Sn(t, e);
                                      }),
                                      e.del.forEach((e) => t.deleteIndex(e));
                                  }),
                                  e._cfg.contentUpgrade);
                              if (p && e._cfg.version > a)
                                return (
                                  pn(r, c),
                                  (s._memoizedTables = {}),
                                  (t = ee(d)),
                                  f.del.forEach((e) => {
                                    t[e] = l[e];
                                  }),
                                  hn(r, [r.Transaction.prototype]),
                                  mn(r, [r.Transaction.prototype], i(t), t),
                                  (s.schema = t),
                                  (n = ue(p)) && ct(),
                                  (d = A.follow(() => {
                                    var e;
                                    (o = p(s)) &&
                                      n &&
                                      ((e = lt.bind(null, null)), o.then(e, e));
                                  })),
                                  o && typeof o.then == `function`
                                    ? A.resolve(o)
                                    : d.then(() => o)
                                );
                            }),
                              l.push((t) => {
                                var n = e._cfg.dbschema,
                                  i = t;
                                [].slice
                                  .call(i.db.objectStoreNames)
                                  .forEach(
                                    (e) =>
                                      n[e] == null && i.db.deleteObjectStore(e),
                                  ),
                                  hn(r, [r.Transaction.prototype]),
                                  mn(
                                    r,
                                    [r.Transaction.prototype],
                                    r._storeNames,
                                    r._dbSchema,
                                  ),
                                  (s.schema = r._dbSchema);
                              }),
                              l.push((t) => {
                                r.idbdb.objectStoreNames.contains(`$meta`) &&
                                  (Math.ceil(r.idbdb.version / 10) ===
                                  e._cfg.version
                                    ? (r.idbdb.deleteObjectStore(`$meta`),
                                      delete r._dbSchema.$meta,
                                      (r._storeNames = r._storeNames.filter(
                                        (e) => e !== `$meta`,
                                      )))
                                    : t
                                        .objectStore(`$meta`)
                                        .put(e._cfg.version, `version`));
                              });
                          }),
                          (function e() {
                            return l.length
                              ? A.resolve(l.shift()(s.idbtrans)).then(e)
                              : A.resolve();
                          })().then(() => {
                            xn(u, c);
                          }));
                    })
                    .catch(s)
                );
              var r, l;
              i(a).forEach((e) => {
                bn(n, e, a[e].primKey, a[e].indexes);
              }),
                pn(e, n),
                A.follow(() => e.on.populate.fire(o)).catch(s);
            });
          }
          function vn(e, t) {
            xn(e._dbSchema, t),
              t.db.version % 10 != 0 ||
                t.objectStoreNames.contains(`$meta`) ||
                t.db
                  .createObjectStore(`$meta`)
                  .add(Math.ceil(t.db.version / 10 - 1), `version`);
            var n = Cn(0, e.idbdb, t);
            wn(e, e._dbSchema, t);
            for (var r = 0, i = yn(n, e._dbSchema).change; r < i.length; r++) {
              var a = ((e) => {
                if (e.change.length || e.recreate)
                  return (
                    console.warn(
                      `Unable to patch indexes of table ${e.name} because it has changes on the type of index or primary key.`,
                    ),
                    { value: void 0 }
                  );
                var n = t.objectStore(e.name);
                e.add.forEach((t) => {
                  De &&
                    console.debug(
                      `Dexie upgrade patch: Creating missing index ${e.name}.${t.src}`,
                    ),
                    Sn(n, t);
                });
              })(i[r]);
              if (typeof a == `object`) return a.value;
            }
          }
          function yn(e, t) {
            var n,
              r = { del: [], add: [], change: [] };
            for (n in e) t[n] || r.del.push(n);
            for (n in t) {
              var i = e[n],
                a = t[n];
              if (i) {
                var o = {
                  name: n,
                  def: a,
                  recreate: !1,
                  del: [],
                  add: [],
                  change: [],
                };
                if (
                  `` + (i.primKey.keyPath || ``) !=
                    `` + (a.primKey.keyPath || ``) ||
                  i.primKey.auto !== a.primKey.auto
                )
                  (o.recreate = !0), r.change.push(o);
                else {
                  var s = i.idxByName,
                    c = a.idxByName,
                    l = void 0;
                  for (l in s) c[l] || o.del.push(l);
                  for (l in c) {
                    var u = s[l],
                      d = c[l];
                    u ? u.src !== d.src && o.change.push(d) : o.add.push(d);
                  }
                  (0 < o.del.length ||
                    0 < o.add.length ||
                    0 < o.change.length) &&
                    r.change.push(o);
                }
              } else r.add.push([n, a]);
            }
            return r;
          }
          function bn(e, t, n, r) {
            var i = e.db.createObjectStore(
              t,
              n.keyPath
                ? { keyPath: n.keyPath, autoIncrement: n.auto }
                : { autoIncrement: n.auto },
            );
            r.forEach((e) => Sn(i, e));
          }
          function xn(e, t) {
            i(e).forEach((n) => {
              t.db.objectStoreNames.contains(n) ||
                (De && console.debug(`Dexie: Creating missing table`, n),
                bn(t, n, e[n].primKey, e[n].indexes));
            });
          }
          function Sn(e, t) {
            e.createIndex(t.name, t.keyPath, {
              unique: t.unique,
              multiEntry: t.multi,
            });
          }
          function Cn(e, t, n) {
            var r = {};
            return (
              g(t.objectStoreNames, 0).forEach((e) => {
                for (
                  var t = n.objectStore(e),
                    i = nn(
                      rn((c = t.keyPath)),
                      c || ``,
                      !0,
                      !1,
                      !!t.autoIncrement,
                      c && typeof c != `string`,
                      !0,
                    ),
                    a = [],
                    o = 0;
                  o < t.indexNames.length;
                  ++o
                ) {
                  var s = t.index(t.indexNames[o]),
                    c = s.keyPath,
                    s = nn(
                      s.name,
                      c,
                      !!s.unique,
                      !!s.multiEntry,
                      !1,
                      c && typeof c != `string`,
                      !1,
                    );
                  a.push(s);
                }
                r[e] = an(e, i, a);
              }),
              r
            );
          }
          function wn(e, t, n) {
            for (var i = n.db.objectStoreNames, a = 0; a < i.length; ++a) {
              var o = i[a],
                s = n.objectStore(o);
              e._hasGetAll = `getAll` in s;
              for (var c = 0; c < s.indexNames.length; ++c) {
                var l,
                  u = s.indexNames[c],
                  d = s.index(u).keyPath,
                  d = typeof d == `string` ? d : `[` + g(d).join(`+`) + `]`;
                t[o] &&
                  (l = t[o].idxByName[d]) &&
                  ((l.name = u),
                  delete t[o].idxByName[d],
                  (t[o].idxByName[u] = l));
              }
            }
            typeof navigator < `u` &&
              /Safari/.test(navigator.userAgent) &&
              !/(Chrome\/|Edge\/)/.test(navigator.userAgent) &&
              r.WorkerGlobalScope &&
              r instanceof r.WorkerGlobalScope &&
              [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 &&
              (e._hasGetAll = !1);
          }
          function Tn(e) {
            return e.split(`,`).map((e, t) => {
              var n = e.split(`:`),
                r = (r = n[1])?.trim(),
                n = (e = n[0].trim()).replace(/([&*]|\+\+)/g, ``),
                i = /^\[/.test(n) ? n.match(/^\[(.*)\]$/)[1].split(`+`) : n;
              return nn(
                n,
                i || null,
                /&/.test(e),
                /\*/.test(e),
                /\+\+/.test(e),
                a(i),
                t === 0,
                r,
              );
            });
          }
          (Dn.prototype._createTableSchema = an),
            (Dn.prototype._parseIndexSyntax = Tn),
            (Dn.prototype._parseStoresSpec = function (e, t) {
              i(e).forEach((r) => {
                if (e[r] !== null) {
                  var i = this._parseIndexSyntax(e[r]),
                    a = i.shift();
                  if (!a)
                    throw new D.Schema(
                      `Invalid schema for table ` + r + `: ` + e[r],
                    );
                  if (((a.unique = !0), a.multi))
                    throw new D.Schema(`Primary key cannot be multiEntry*`);
                  i.forEach((e) => {
                    if (e.auto)
                      throw new D.Schema(
                        `Only primary key can be marked as autoIncrement (++)`,
                      );
                    if (!e.keyPath)
                      throw new D.Schema(
                        `Index must have a name and cannot be an empty string`,
                      );
                  }),
                    (a = this._createTableSchema(r, a, i)),
                    (t[r] = a);
                }
              });
            }),
            (Dn.prototype.stores = function (e) {
              var t = this.db,
                e =
                  ((this._cfg.storesSource = this._cfg.storesSource
                    ? o(this._cfg.storesSource, e)
                    : e),
                  t._versions),
                n = {},
                r = {};
              return (
                e.forEach((e) => {
                  o(n, e._cfg.storesSource),
                    (r = e._cfg.dbschema = {}),
                    e._parseStoresSpec(n, r);
                }),
                (t._dbSchema = r),
                hn(t, [t._allTables, t, t.Transaction.prototype]),
                mn(
                  t,
                  [t._allTables, t, t.Transaction.prototype, this._cfg.tables],
                  i(r),
                  r,
                ),
                (t._storeNames = i(r)),
                this
              );
            }),
            (Dn.prototype.upgrade = function (e) {
              return (
                (this._cfg.contentUpgrade = Ee(
                  this._cfg.contentUpgrade || O,
                  e,
                )),
                this
              );
            });
          var En = Dn;
          function Dn() {}
          var On = (() => {
            var e, t, n;
            return typeof FinalizationRegistry < `u` && typeof WeakRef < `u`
              ? ((e = new Set()),
                (t = new FinalizationRegistry((t) => {
                  e.delete(t);
                })),
                {
                  toArray: () =>
                    Array.from(e)
                      .map((e) => e.deref())
                      .filter((e) => e !== void 0),
                  add: (n) => {
                    var r = new WeakRef(n._novip);
                    e.add(r),
                      t.register(n._novip, r, r),
                      e.size > n._options.maxConnections &&
                        ((r = e.values().next().value),
                        e.delete(r),
                        t.unregister(r));
                  },
                  remove: (n) => {
                    if (n)
                      for (var r = e.values(), i = r.next(); !i.done; ) {
                        var a = i.value;
                        if (a.deref() === n._novip)
                          return e.delete(a), void t.unregister(a);
                        i = r.next();
                      }
                  },
                })
              : ((n = []),
                {
                  toArray: () => n,
                  add: (e) => {
                    n.push(e._novip);
                  },
                  remove: (e) => {
                    e && (e = n.indexOf(e._novip)) !== -1 && n.splice(e, 1);
                  },
                });
          })();
          function kn(e, t) {
            var n = e._dbNamesDB;
            return (
              n ||
                (n = e._dbNamesDB =
                  new pr(yt, { addons: [], indexedDB: e, IDBKeyRange: t }))
                  .version(1)
                  .stores({ dbnames: `name` }),
              n.table(`dbnames`)
            );
          }
          function An(e) {
            return e && typeof e.databases == `function`;
          }
          function jn(e) {
            return st(() => ((k.letThrough = !0), e()));
          }
          function Mn(e) {
            return !(`from` in e);
          }
          var H = function (e, t) {
            var n;
            if (!this) return (n = new H()), e && `d` in e && o(n, e), n;
            o(
              this,
              arguments.length
                ? { d: 1, from: e, to: 1 < arguments.length ? t : e }
                : { d: 0 },
            );
          };
          function Nn(e, t, n) {
            var r = F(t, n);
            if (!isNaN(r)) {
              if (0 < r) throw RangeError();
              if (Mn(e)) return o(e, { from: t, to: n, d: 1 });
              var r = e.l,
                i = e.r;
              if (F(n, e.from) < 0)
                return (
                  r
                    ? Nn(r, t, n)
                    : (e.l = { from: t, to: n, d: 1, l: null, r: null }),
                  Ln(e)
                );
              if (0 < F(t, e.to))
                return (
                  i
                    ? Nn(i, t, n)
                    : (e.r = { from: t, to: n, d: 1, l: null, r: null }),
                  Ln(e)
                );
              F(t, e.from) < 0 &&
                ((e.from = t), (e.l = null), (e.d = i ? i.d + 1 : 1)),
                0 < F(n, e.to) &&
                  ((e.to = n), (e.r = null), (e.d = e.l ? e.l.d + 1 : 1)),
                (t = !e.r),
                r && !e.l && Pn(e, r),
                i && t && Pn(e, i);
            }
          }
          function Pn(e, t) {
            Mn(t) ||
              (function e(t, n) {
                var r = n.from,
                  i = n.l,
                  a = n.r;
                Nn(t, r, n.to), i && e(t, i), a && e(t, a);
              })(e, t);
          }
          function Fn(e, t) {
            var n = In(t),
              r = n.next();
            if (!r.done)
              for (
                var i = r.value, a = In(e), o = a.next(i.from), s = o.value;
                !r.done && !o.done;
              ) {
                if (F(s.from, i.to) <= 0 && 0 <= F(s.to, i.from)) return !0;
                F(i.from, s.from) < 0
                  ? (i = (r = n.next(s.from)).value)
                  : (s = (o = a.next(i.from)).value);
              }
            return !1;
          }
          function In(e) {
            var t = Mn(e) ? null : { s: 0, n: e };
            return {
              next: function (e) {
                for (var n = 0 < arguments.length; t; )
                  switch (t.s) {
                    case 0:
                      if (((t.s = 1), n))
                        for (; t.n.l && F(e, t.n.from) < 0; )
                          t = { up: t, n: t.n.l, s: 1 };
                      else for (; t.n.l; ) t = { up: t, n: t.n.l, s: 1 };
                    case 1:
                      if (((t.s = 2), !n || F(e, t.n.to) <= 0))
                        return { value: t.n, done: !1 };
                    case 2:
                      if (t.n.r) {
                        (t.s = 3), (t = { up: t, n: t.n.r, s: 0 });
                        continue;
                      }
                    case 3:
                      t = t.up;
                  }
                return { done: !0 };
              },
            };
          }
          function Ln(e) {
            var n,
              r,
              i,
              a = ((a = e.r)?.d || 0) - ((a = e.l)?.d || 0),
              a = 1 < a ? `r` : a < -1 ? `l` : ``;
            a &&
              ((n = a == `r` ? `l` : `r`),
              (r = t({}, e)),
              (i = e[a]),
              (e.from = i.from),
              (e.to = i.to),
              (e[a] = i[a]),
              (r[a] = i[n]),
              ((e[n] = r).d = Rn(r))),
              (e.d = Rn(e));
          }
          function Rn(e) {
            var t = e.r,
              e = e.l;
            return (t ? (e ? Math.max(t.d, e.d) : t.d) : e ? e.d : 0) + 1;
          }
          function zn(e, t) {
            return (
              i(t).forEach((n) => {
                e[n]
                  ? Pn(e[n], t[n])
                  : (e[n] = (function e(t) {
                      var n,
                        r,
                        i = {};
                      for (n in t)
                        l(t, n) &&
                          ((r = t[n]),
                          (i[n] =
                            !r || typeof r != `object` || te.has(r.constructor)
                              ? r
                              : e(r)));
                      return i;
                    })(t[n]));
              }),
              e
            );
          }
          function Bn(e, t) {
            return (
              e.all ||
              t.all ||
              Object.keys(e).some((n) => t[n] && Fn(t[n], e[n]))
            );
          }
          u(
            H.prototype,
            (((E = {
              add: function (e) {
                return Pn(this, e), this;
              },
              addKey: function (e) {
                return Nn(this, e, e), this;
              },
              addKeys: function (e) {
                return e.forEach((e) => Nn(this, e, e)), this;
              },
              hasKey: function (e) {
                var t = In(this).next(e).value;
                return t && F(t.from, e) <= 0 && 0 <= F(t.to, e);
              },
            })[oe] = function () {
              return In(this);
            }),
            E),
          );
          var Vn = {},
            Hn = {},
            Un = !1;
          function Wn(e) {
            zn(Hn, e),
              Un ||
                ((Un = !0),
                setTimeout(() => {
                  (Un = !1), Gn(Hn, !(Hn = {}));
                }, 0));
          }
          function Gn(e, t) {
            t === void 0 && (t = !1);
            var n = new Set();
            if (e.all)
              for (var r = 0, i = Object.values(Vn); r < i.length; r++)
                Kn((s = i[r]), e, n, t);
            else
              for (var a in e) {
                var o,
                  s,
                  a = /^idb:\/\/(.*)\/(.*)\//.exec(a);
                a &&
                  ((o = a[1]), (a = a[2]), (s = Vn[`idb://${o}/${a}`])) &&
                  Kn(s, e, n, t);
              }
            n.forEach((e) => e());
          }
          function Kn(e, t, n, r) {
            for (
              var i = [], a = 0, o = Object.entries(e.queries.query);
              a < o.length;
              a++
            ) {
              for (
                var s = o[a], c = s[0], l = [], u = 0, d = s[1];
                u < d.length;
                u++
              ) {
                var f = d[u];
                Bn(t, f.obsSet)
                  ? f.subscribers.forEach((e) => n.add(e))
                  : r && l.push(f);
              }
              r && i.push([c, l]);
            }
            if (r)
              for (var p = 0, m = i; p < m.length; p++) {
                var h = m[p],
                  c = h[0],
                  l = h[1];
                e.queries.query[c] = l;
              }
          }
          function qn(e) {
            var t = e._state,
              n = e._deps.indexedDB;
            if (t.isBeingOpened || e.idbdb)
              return t.dbReadyPromise.then(() =>
                t.dbOpenError ? N(t.dbOpenError) : e,
              );
            (t.isBeingOpened = !0),
              (t.dbOpenError = null),
              (t.openComplete = !1);
            var r = t.openCanceller,
              a = Math.round(10 * e.verno),
              o = !1;
            function s() {
              if (t.openCanceller !== r)
                throw new D.DatabaseClosed(`db.open() was cancelled`);
            }
            function c() {
              return new A((r, l) => {
                if ((s(), !n)) throw new D.MissingAPI();
                var u = e.name,
                  p = t.autoSchema || !a ? n.open(u) : n.open(u, a);
                if (!p) throw new D.MissingAPI();
                (p.onerror = Yt(l)),
                  (p.onblocked = j(e._fireOnBlocked)),
                  (p.onupgradeneeded = j((r) => {
                    var i;
                    (d = p.transaction),
                      t.autoSchema && !e._options.allowEmptyDB
                        ? ((p.onerror = Xt),
                          d.abort(),
                          p.result.close(),
                          ((i = n.deleteDatabase(u)).onsuccess = i.onerror =
                            j(() => {
                              l(
                                new D.NoSuchDatabase(
                                  `Database ${u} doesnt exist`,
                                ),
                              );
                            })))
                        : ((d.onerror = Yt(l)),
                          (i = r.oldVersion > 2 ** 62 ? 0 : r.oldVersion),
                          (f = i < 1),
                          (e.idbdb = p.result),
                          o && vn(e, d),
                          _n(e, i / 10, d, l));
                  }, l)),
                  (p.onsuccess = j(() => {
                    d = null;
                    var n,
                      s,
                      l,
                      m,
                      h,
                      _,
                      v = (e.idbdb = p.result),
                      y = g(v.objectStoreNames);
                    if (0 < y.length)
                      try {
                        var b = v.transaction(
                          (h = y).length === 1 ? h[0] : h,
                          `readonly`,
                        );
                        if (t.autoSchema)
                          (_ = v),
                            (m = b),
                            ((l = e).verno = _.version / 10),
                            (m = l._dbSchema = Cn(0, _, m)),
                            (l._storeNames = g(_.objectStoreNames, 0)),
                            mn(l, [l._allTables], i(m), m);
                        else if (
                          (wn(e, e._dbSchema, b),
                          (s = b),
                          ((s = yn(Cn(0, (n = e).idbdb, s), n._dbSchema)).add
                            .length ||
                            s.change.some(
                              (e) => e.add.length || e.change.length,
                            )) &&
                            !o)
                        )
                          return (
                            console.warn(
                              `Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this.`,
                            ),
                            v.close(),
                            (a = v.version + 1),
                            (o = !0),
                            r(c())
                          );
                        pn(e, b);
                      } catch {}
                    On.add(e),
                      (v.onversionchange = j((n) => {
                        (t.vcFired = !0), e.on(`versionchange`).fire(n);
                      })),
                      (v.onclose = j(() => {
                        e.close({ disableAutoOpen: !1 });
                      })),
                      f &&
                        ((y = e._deps),
                        (h = u),
                        An((_ = y.indexedDB)) ||
                          h === yt ||
                          kn(_, y.IDBKeyRange).put({ name: h }).catch(O)),
                      r();
                  }, l));
              }).catch((e) => {
                switch (e?.name) {
                  case `UnknownError`:
                    if (0 < t.PR1398_maxLoop)
                      return (
                        t.PR1398_maxLoop--,
                        console.warn(
                          `Dexie: Workaround for Chrome UnknownError on open()`,
                        ),
                        c()
                      );
                    break;
                  case `VersionError`:
                    if (0 < a) return (a = 0), c();
                }
                return A.reject(e);
              });
            }
            var l,
              u = t.dbReadyResolve,
              d = null,
              f = !1;
            return A.race([
              r,
              (typeof navigator > `u`
                ? A.resolve()
                : !navigator.userAgentData &&
                    /Safari\//.test(navigator.userAgent) &&
                    !/Chrom(e|ium)\//.test(navigator.userAgent) &&
                    indexedDB.databases
                  ? new Promise((e) => {
                      function t() {
                        return indexedDB.databases().finally(e);
                      }
                      (l = setInterval(t, 100)), t();
                    }).finally(() => clearInterval(l))
                  : Promise.resolve()
              ).then(c),
            ])
              .then(
                () => (
                  s(),
                  (t.onReadyBeingFired = []),
                  A.resolve(jn(() => e.on.ready.fire(e.vip))).then(
                    function n() {
                      var r;
                      if (0 < t.onReadyBeingFired.length)
                        return (
                          (r = t.onReadyBeingFired.reduce(Ee, O)),
                          (t.onReadyBeingFired = []),
                          A.resolve(jn(() => r(e.vip))).then(n)
                        );
                    },
                  )
                ),
              )
              .finally(() => {
                t.openCanceller === r &&
                  ((t.onReadyBeingFired = null), (t.isBeingOpened = !1));
              })
              .catch((n) => {
                t.dbOpenError = n;
                try {
                  d && d.abort();
                } catch {}
                return r === t.openCanceller && e._close(), N(n);
              })
              .finally(() => {
                (t.openComplete = !0), u();
              })
              .then(() => {
                var t;
                return (
                  f &&
                    ((t = {}),
                    e.tables.forEach((n) => {
                      n.schema.indexes.forEach((r) => {
                        r.name &&
                          (t[`idb://${e.name}/${n.name}/${r.name}`] = new H(
                            -1 / 0,
                            [[[]]],
                          ));
                      }),
                        (t[`idb://${e.name}/${n.name}/`] = t[
                          `idb://${e.name}/${n.name}/:dels`
                        ] =
                          new H(-1 / 0, [[[]]]));
                    }),
                    $t(Zt).fire(t),
                    Gn(t, !0)),
                  e
                );
              });
          }
          function Jn(e) {
            function t(t) {
              return e.next(t);
            }
            var n = i(t),
              r = i((t) => e.throw(t));
            function i(e) {
              return (t) => {
                var t = e(t),
                  i = t.value;
                return t.done
                  ? i
                  : i && typeof i.then == `function`
                    ? i.then(n, r)
                    : a(i)
                      ? Promise.all(i).then(n, r)
                      : n(i);
              };
            }
            return i(t)();
          }
          function Yn(e, t, n) {
            for (var r = a(e) ? e.slice() : [e], i = 0; i < n; ++i) r.push(t);
            return r;
          }
          var Xn = {
            stack: `dbcore`,
            name: `VirtualIndexMiddleware`,
            level: 1,
            create: (e) =>
              t(t({}, e), {
                table: (n) => {
                  var r = e.table(n),
                    n = r.schema,
                    i = {},
                    a = [];
                  function o(e, n, r) {
                    var s = un(e),
                      c = (i[s] = i[s] || []),
                      l = e == null ? 0 : typeof e == `string` ? 1 : e.length,
                      u = 0 < n,
                      s = t(t({}, r), {
                        name: u ? `${s}(virtual-from:${r.name})` : r.name,
                        lowLevelIndex: r,
                        isVirtual: u,
                        keyTail: n,
                        keyLength: l,
                        extractKey: sn(e),
                        unique: !u && r.unique,
                      });
                    return (
                      c.push(s),
                      s.isPrimaryKey || a.push(s),
                      1 < l && o(l === 2 ? e[0] : e.slice(0, l - 1), n + 1, r),
                      c.sort((e, t) => e.keyTail - t.keyTail),
                      s
                    );
                  }
                  var s = o(n.primaryKey.keyPath, 0, n.primaryKey);
                  i[`:id`] = [s];
                  for (var c = 0, l = n.indexes; c < l.length; c++) {
                    var u = l[c];
                    o(u.keyPath, 0, u);
                  }
                  function d(n) {
                    var r,
                      i = n.query.index;
                    return i.isVirtual
                      ? t(t({}, n), {
                          query: {
                            index: i.lowLevelIndex,
                            range:
                              ((r = n.query.range),
                              (i = i.keyTail),
                              {
                                type: r.type === 1 ? 2 : r.type,
                                lower: Yn(
                                  r.lower,
                                  r.lowerOpen ? e.MAX_KEY : e.MIN_KEY,
                                  i,
                                ),
                                lowerOpen: !0,
                                upper: Yn(
                                  r.upper,
                                  r.upperOpen ? e.MIN_KEY : e.MAX_KEY,
                                  i,
                                ),
                                upperOpen: !0,
                              }),
                          },
                        })
                      : n;
                  }
                  return t(t({}, r), {
                    schema: t(t({}, n), {
                      primaryKey: s,
                      indexes: a,
                      getIndexByKeyPath: (e) => (e = i[un(e)]) && e[0],
                    }),
                    count: (e) => r.count(d(e)),
                    query: (e) => r.query(d(e)),
                    openCursor: (t) => {
                      var n = t.query.index,
                        i = n.keyTail,
                        a = n.keyLength;
                      return n.isVirtual
                        ? r.openCursor(d(t)).then((e) => e && o(e))
                        : r.openCursor(t);
                      function o(n) {
                        return Object.create(n, {
                          continue: {
                            value: (r) => {
                              r == null
                                ? t.unique
                                  ? n.continue(
                                      n.key
                                        .slice(0, a)
                                        .concat(
                                          t.reverse ? e.MIN_KEY : e.MAX_KEY,
                                          i,
                                        ),
                                    )
                                  : n.continue()
                                : n.continue(
                                    Yn(r, t.reverse ? e.MAX_KEY : e.MIN_KEY, i),
                                  );
                            },
                          },
                          continuePrimaryKey: {
                            value: (t, r) => {
                              n.continuePrimaryKey(Yn(t, e.MAX_KEY, i), r);
                            },
                          },
                          primaryKey: { get: () => n.primaryKey },
                          key: {
                            get: () => {
                              var e = n.key;
                              return a === 1 ? e[0] : e.slice(0, a);
                            },
                          },
                          value: { get: () => n.value },
                        });
                      }
                    },
                  });
                },
              }),
          };
          function Zn(e, t, n, r) {
            return (
              (n ||= {}),
              (r ||= ``),
              i(e).forEach((i) => {
                var a, o, s;
                l(t, i)
                  ? ((a = e[i]),
                    (o = t[i]),
                    typeof a == `object` && typeof o == `object` && a && o
                      ? (s = ae(a)) === ae(o)
                        ? s === `Object`
                          ? Zn(a, o, n, r + i + `.`)
                          : a !== o && (n[r + i] = t[i])
                        : (n[r + i] = t[i])
                      : a !== o && (n[r + i] = t[i]))
                  : (n[r + i] = void 0);
              }),
              i(t).forEach((i) => {
                l(e, i) || (n[r + i] = t[i]);
              }),
              n
            );
          }
          function Qn(e, t) {
            return t.type === `delete`
              ? t.keys
              : t.keys || t.values.map(e.extractKey);
          }
          var $n = {
            stack: `dbcore`,
            name: `HooksMiddleware`,
            level: 2,
            create: (e) =>
              t(t({}, e), {
                table: (r) => {
                  var i = e.table(r),
                    a = i.schema.primaryKey;
                  return t(t({}, i), {
                    mutate: (e) => {
                      var o = k.trans,
                        s = o.table(r).hook,
                        c = s.deleting,
                        u = s.creating,
                        d = s.updating;
                      switch (e.type) {
                        case `add`:
                          if (u.fire === O) break;
                          return o._promise(`readwrite`, () => f(e), !0);
                        case `put`:
                          if (u.fire === O && d.fire === O) break;
                          return o._promise(`readwrite`, () => f(e), !0);
                        case `delete`:
                          if (c.fire === O) break;
                          return o._promise(`readwrite`, () => f(e), !0);
                        case `deleteRange`:
                          if (c.fire === O) break;
                          return o._promise(
                            `readwrite`,
                            () =>
                              (function e(n, r, o) {
                                return i
                                  .query({
                                    trans: n,
                                    values: !1,
                                    query: { index: a, range: r },
                                    limit: o,
                                  })
                                  .then((i) => {
                                    var a = i.result;
                                    return f({
                                      type: `delete`,
                                      keys: a,
                                      trans: n,
                                    }).then((i) =>
                                      0 < i.numFailures
                                        ? Promise.reject(i.failures[0])
                                        : a.length < o
                                          ? {
                                              failures: [],
                                              numFailures: 0,
                                              lastResult: void 0,
                                            }
                                          : e(
                                              n,
                                              t(t({}, r), {
                                                lower: a[a.length - 1],
                                                lowerOpen: !0,
                                              }),
                                              o,
                                            ),
                                    );
                                  });
                              })(e.trans, e.range, 1e4),
                            !0,
                          );
                      }
                      return i.mutate(e);
                      function f(e) {
                        var r,
                          o,
                          s,
                          f = k.trans,
                          p = e.keys || Qn(a, e);
                        if (p)
                          return (
                            (e =
                              e.type === `add` || e.type === `put`
                                ? t(t({}, e), { keys: p })
                                : t({}, e)).type !== `delete` &&
                              (e.values = n([], e.values, !0)),
                            (e.keys &&= n([], e.keys, !0)),
                            (r = i),
                            (s = p),
                            ((o = e).type === `add`
                              ? Promise.resolve([])
                              : r.getMany({
                                  trans: o.trans,
                                  keys: s,
                                  cache: `immutable`,
                                })
                            ).then((t) => {
                              var n = p.map((n, r) => {
                                var i,
                                  o,
                                  s,
                                  p = t[r],
                                  m = { onerror: null, onsuccess: null };
                                return (
                                  e.type === `delete`
                                    ? c.fire.call(m, n, p, f)
                                    : e.type === `add` || p === void 0
                                      ? ((i = u.fire.call(
                                          m,
                                          n,
                                          e.values[r],
                                          f,
                                        )),
                                        n == null &&
                                          i != null &&
                                          ((e.keys[r] = n = i),
                                          a.outbound ||
                                            x(e.values[r], a.keyPath, n)))
                                      : ((i = Zn(p, e.values[r])),
                                        (o = d.fire.call(m, i, n, p, f)) &&
                                          ((s = e.values[r]),
                                          Object.keys(o).forEach((e) => {
                                            l(s, e)
                                              ? (s[e] = o[e])
                                              : x(s, e, o[e]);
                                          }))),
                                  m
                                );
                              });
                              return i
                                .mutate(e)
                                .then((r) => {
                                  for (
                                    var i = r.failures,
                                      a = r.results,
                                      o = r.numFailures,
                                      r = r.lastResult,
                                      s = 0;
                                    s < p.length;
                                    ++s
                                  ) {
                                    var c = (a || p)[s],
                                      l = n[s];
                                    c == null
                                      ? l.onerror && l.onerror(i[s])
                                      : l.onsuccess &&
                                        l.onsuccess(
                                          e.type === `put` && t[s]
                                            ? e.values[s]
                                            : c,
                                        );
                                  }
                                  return {
                                    failures: i,
                                    results: a,
                                    numFailures: o,
                                    lastResult: r,
                                  };
                                })
                                .catch(
                                  (e) => (
                                    n.forEach((t) => t.onerror && t.onerror(e)),
                                    Promise.reject(e)
                                  ),
                                );
                            })
                          );
                        throw Error(`Keys missing`);
                      }
                    },
                  });
                },
              }),
          };
          function er(e, t, n) {
            try {
              if (!t || t.keys.length < e.length) return null;
              for (
                var r = [], i = 0, a = 0;
                i < t.keys.length && a < e.length;
                ++i
              )
                F(t.keys[i], e[a]) === 0 &&
                  (r.push(n ? re(t.values[i]) : t.values[i]), ++a);
              return r.length === e.length ? r : null;
            } catch {
              return null;
            }
          }
          var tr = {
            stack: `dbcore`,
            level: -1,
            create: (e) => ({
              table: (n) => {
                var r = e.table(n);
                return t(t({}, r), {
                  getMany: (e) => {
                    var t;
                    return e.cache
                      ? (t = er(e.keys, e.trans._cache, e.cache === `clone`))
                        ? A.resolve(t)
                        : r.getMany(e).then(
                            (t) => (
                              (e.trans._cache = {
                                keys: e.keys,
                                values: e.cache === `clone` ? re(t) : t,
                              }),
                              t
                            ),
                          )
                      : r.getMany(e);
                  },
                  mutate: (e) => (
                    e.type !== `add` && (e.trans._cache = null), r.mutate(e)
                  ),
                });
              },
            }),
          };
          function nr(e, t) {
            return (
              e.trans.mode === `readonly` &&
              !!e.subscr &&
              !e.trans.explicit &&
              e.trans.db._options.cache !== `disabled` &&
              !t.schema.primaryKey.outbound
            );
          }
          function rr(e, t) {
            switch (e) {
              case `query`:
                return t.values && !t.unique;
              case `get`:
              case `getMany`:
              case `count`:
              case `openCursor`:
                return !1;
            }
          }
          var ir = {
            stack: `dbcore`,
            level: 0,
            name: `Observability`,
            create: (e) => {
              var n = e.schema.name,
                r = new H(e.MIN_KEY, e.MAX_KEY);
              return t(t({}, e), {
                transaction: (t, n, r) => {
                  if (k.subscr && n !== `readonly`)
                    throw new D.ReadOnly(
                      `Readwrite transaction in liveQuery context. Querier source: ${k.querier}`,
                    );
                  return e.transaction(t, n, r);
                },
                table: (o) => {
                  function s(t) {
                    var t = t.query;
                    return [
                      t.index,
                      new H(
                        (t = t.range).lower ?? e.MIN_KEY,
                        t.upper ?? e.MAX_KEY,
                      ),
                    ];
                  }
                  var c = e.table(o),
                    l = c.schema,
                    u = l.primaryKey,
                    d = l.indexes,
                    f = u.extractKey,
                    p = u.outbound,
                    m =
                      u.autoIncrement &&
                      d.filter(
                        (e) => e.compound && e.keyPath.includes(u.keyPath),
                      ),
                    h = t(t({}, c), {
                      mutate: (t) => {
                        function i(e) {
                          return (
                            (e = `idb://${n}/${o}/${e}`),
                            h[e] || (h[e] = new H())
                          );
                        }
                        var s,
                          d,
                          f,
                          p = t.trans,
                          h = (t.mutatedParts ||= {}),
                          g = i(``),
                          _ = i(`:dels`),
                          v = t.type,
                          y =
                            t.type === `deleteRange`
                              ? [t.range]
                              : t.type === `delete`
                                ? [t.keys]
                                : t.values.length < 50
                                  ? [Qn(u, t).filter((e) => e), t.values]
                                  : [],
                          b = y[0],
                          y = y[1],
                          x = t.trans._cache;
                        return (
                          a(b)
                            ? (g.addKeys(b),
                              (v =
                                v === `delete` || b.length === y.length
                                  ? er(b, x)
                                  : null) || _.addKeys(b),
                              (v || y) &&
                                ((s = i),
                                (d = v),
                                (f = y),
                                l.indexes.forEach((e) => {
                                  var t = s(e.name || ``);
                                  function n(t) {
                                    return t == null ? null : e.extractKey(t);
                                  }
                                  function r(n) {
                                    e.multiEntry && a(n)
                                      ? n.forEach((e) => t.addKey(e))
                                      : t.addKey(n);
                                  }
                                  (d || f).forEach((e, t) => {
                                    var i = d && n(d[t]),
                                      t = f && n(f[t]);
                                    F(i, t) !== 0 &&
                                      (i != null && r(i), t != null) &&
                                      r(t);
                                  });
                                })))
                            : b
                              ? ((y = {
                                  from: (x = b.lower) ?? e.MIN_KEY,
                                  to: (v = b.upper) ?? e.MAX_KEY,
                                }),
                                _.add(y),
                                g.add(y))
                              : (g.add(r),
                                _.add(r),
                                l.indexes.forEach((e) => i(e.name).add(r))),
                          c.mutate(t).then(
                            (e) => (
                              !b ||
                                (t.type !== `add` && t.type !== `put`) ||
                                (g.addKeys(e.results),
                                m &&
                                  m.forEach((n) => {
                                    for (
                                      var r = t.values.map((e) =>
                                          n.extractKey(e),
                                        ),
                                        a = n.keyPath.findIndex(
                                          (e) => e === u.keyPath,
                                        ),
                                        o = 0,
                                        s = e.results.length;
                                      o < s;
                                      ++o
                                    )
                                      r[o][a] = e.results[o];
                                    i(n.name).addKeys(r);
                                  })),
                              (p.mutatedParts = zn(p.mutatedParts || {}, h)),
                              e
                            ),
                          )
                        );
                      },
                    }),
                    g = {
                      get: (e) => [u, new H(e.key)],
                      getMany: (e) => [u, new H().addKeys(e.keys)],
                      count: s,
                      query: s,
                      openCursor: s,
                    };
                  return (
                    i(g).forEach((e) => {
                      h[e] = function (i) {
                        var a = k.subscr,
                          s = !!a,
                          l = nr(k, c) && rr(e, i) ? (i.obsSet = {}) : a;
                        if (s) {
                          var u,
                            a = (e) => (
                              (e = `idb://${n}/${o}/${e}`),
                              l[e] || (l[e] = new H())
                            ),
                            d = a(``),
                            m = a(`:dels`),
                            s = g[e](i),
                            h = s[0],
                            s = s[1];
                          if (
                            ((e === `query` && h.isPrimaryKey && !i.values
                              ? m
                              : a(h.name || ``)
                            ).add(s),
                            !h.isPrimaryKey)
                          ) {
                            if (e !== `count`)
                              return (
                                (u =
                                  e === `query` &&
                                  p &&
                                  i.values &&
                                  c.query(t(t({}, i), { values: !1 }))),
                                c[e].apply(this, arguments).then((t) => {
                                  if (e === `query`) {
                                    if (p && i.values)
                                      return u.then(
                                        (e) => (
                                          (e = e.result), d.addKeys(e), t
                                        ),
                                      );
                                    var n = i.values
                                      ? t.result.map(f)
                                      : t.result;
                                    (i.values ? d : m).addKeys(n);
                                  } else {
                                    var r, a;
                                    if (e === `openCursor`)
                                      return (
                                        (a = i.values),
                                        (r = t) &&
                                          Object.create(r, {
                                            key: {
                                              get: () => (
                                                m.addKey(r.primaryKey), r.key
                                              ),
                                            },
                                            primaryKey: {
                                              get: () => {
                                                var e = r.primaryKey;
                                                return m.addKey(e), e;
                                              },
                                            },
                                            value: {
                                              get: () => (
                                                a && d.addKey(r.primaryKey),
                                                r.value
                                              ),
                                            },
                                          })
                                      );
                                  }
                                  return t;
                                })
                              );
                            m.add(r);
                          }
                        }
                        return c[e].apply(this, arguments);
                      };
                    }),
                    h
                  );
                },
              });
            },
          };
          function ar(e, n, r) {
            var i;
            return r.numFailures === 0
              ? n
              : n.type === `deleteRange` ||
                  ((i = n.keys
                    ? n.keys.length
                    : `values` in n && n.values
                      ? n.values.length
                      : 1),
                  r.numFailures === i)
                ? null
                : ((i = t({}, n)),
                  a(i.keys) &&
                    (i.keys = i.keys.filter((e, t) => !(t in r.failures))),
                  `values` in i &&
                    a(i.values) &&
                    (i.values = i.values.filter((e, t) => !(t in r.failures))),
                  i);
          }
          function or(e, t) {
            return (
              (n = e),
              ((r = t).lower === void 0 ||
                (r.lowerOpen ? 0 < F(n, r.lower) : 0 <= F(n, r.lower))) &&
                ((n = e),
                (r = t).upper === void 0 ||
                  (r.upperOpen ? F(n, r.upper) < 0 : F(n, r.upper) <= 0))
            );
            var n, r;
          }
          function sr(e, t, n, r, i, o) {
            var s, c, l, u, d, f, p;
            return !n ||
              n.length === 0 ||
              ((s = t.query.index),
              (c = s.multiEntry),
              (l = t.query.range),
              (u = r.schema.primaryKey.extractKey),
              (d = s.extractKey),
              (f = (s.lowLevelIndex || s).extractKey),
              (r = n.reduce((e, n) => {
                var r = e,
                  i = [];
                if (n.type === `add` || n.type === `put`)
                  for (var o = new H(), s = n.values.length - 1; 0 <= s; --s) {
                    var f,
                      p = n.values[s],
                      m = u(p);
                    !o.hasKey(m) &&
                      ((f = d(p)),
                      c && a(f) ? f.some((e) => or(e, l)) : or(f, l)) &&
                      (o.addKey(m), i.push(p));
                  }
                switch (n.type) {
                  case `add`: {
                    var h = new H().addKeys(t.values ? e.map((e) => u(e)) : e),
                      r = e.concat(
                        t.values
                          ? i.filter(
                              (e) => (
                                (e = u(e)), !h.hasKey(e) && (h.addKey(e), !0)
                              ),
                            )
                          : i
                              .map((e) => u(e))
                              .filter((e) => !h.hasKey(e) && (h.addKey(e), !0)),
                      );
                    break;
                  }
                  case `put`: {
                    var g = new H().addKeys(n.values.map((e) => u(e)));
                    r = e
                      .filter((e) => !g.hasKey(t.values ? u(e) : e))
                      .concat(t.values ? i : i.map((e) => u(e)));
                    break;
                  }
                  case `delete`: {
                    var _ = new H().addKeys(n.keys);
                    r = e.filter((e) => !_.hasKey(t.values ? u(e) : e));
                    break;
                  }
                  case `deleteRange`: {
                    var v = n.range;
                    r = e.filter((e) => !or(u(e), v));
                  }
                }
                return r;
              }, e)) === e)
              ? e
              : ((p = (e, t) => F(f(e), f(t)) || F(u(e), u(t))),
                r.sort(
                  t.direction === `prev` || t.direction === `prevunique`
                    ? (e, t) => p(t, e)
                    : p,
                ),
                t.limit &&
                  t.limit < 1 / 0 &&
                  (r.length > t.limit
                    ? (r.length = t.limit)
                    : e.length === t.limit &&
                      r.length < t.limit &&
                      (i.dirty = !0)),
                o ? Object.freeze(r) : r);
          }
          function cr(e, t) {
            return (
              F(e.lower, t.lower) === 0 &&
              F(e.upper, t.upper) === 0 &&
              !!e.lowerOpen == !!t.lowerOpen &&
              !!e.upperOpen == !!t.upperOpen
            );
          }
          function lr(e, t) {
            return (
              ((e, t, n, r) => {
                if (e === void 0) return t === void 0 ? 0 : -1;
                if (t === void 0) return 1;
                if ((e = F(e, t)) === 0) {
                  if (n && r) return 0;
                  if (n) return 1;
                  if (r) return -1;
                }
                return e;
              })(e.lower, t.lower, e.lowerOpen, t.lowerOpen) <= 0 &&
              0 <=
                ((e, t, n, r) => {
                  if (e === void 0) return t === void 0 ? 0 : 1;
                  if (t === void 0) return -1;
                  if ((e = F(e, t)) === 0) {
                    if (n && r) return 0;
                    if (n) return -1;
                    if (r) return 1;
                  }
                  return e;
                })(e.upper, t.upper, e.upperOpen, t.upperOpen)
            );
          }
          function ur(e, t, n, r) {
            e.subscribers.add(n),
              r.addEventListener(`abort`, () => {
                var r, i;
                e.subscribers.delete(n),
                  e.subscribers.size === 0 &&
                    ((r = e),
                    (i = t),
                    setTimeout(() => {
                      r.subscribers.size === 0 && ce(i, r);
                    }, 3e3));
              });
          }
          var dr = {
            stack: `dbcore`,
            level: 0,
            name: `Cache`,
            create: (e) => {
              var n = e.schema.name;
              return t(t({}, e), {
                transaction: (t, r, i) => {
                  var a,
                    o,
                    s = e.transaction(t, r, i);
                  return (
                    r === `readwrite` &&
                      ((i = (a = new AbortController()).signal),
                      s.addEventListener(
                        `abort`,
                        (o = (i) => () => {
                          if ((a.abort(), r === `readwrite`)) {
                            for (
                              var o = new Set(), c = 0, l = t;
                              c < l.length;
                              c++
                            ) {
                              var u = l[c],
                                d = Vn[`idb://${n}/${u}`];
                              if (d) {
                                var f = e.table(u),
                                  p = d.optimisticOps.filter(
                                    (e) => e.trans === s,
                                  );
                                if (s._explicit && i && s.mutatedParts)
                                  for (
                                    var m = 0,
                                      h = Object.values(d.queries.query);
                                    m < h.length;
                                    m++
                                  )
                                    for (
                                      var g = 0, _ = (b = h[m]).slice();
                                      g < _.length;
                                      g++
                                    )
                                      Bn((x = _[g]).obsSet, s.mutatedParts) &&
                                        (ce(b, x),
                                        x.subscribers.forEach((e) => o.add(e)));
                                else if (0 < p.length) {
                                  d.optimisticOps = d.optimisticOps.filter(
                                    (e) => e.trans !== s,
                                  );
                                  for (
                                    var v = 0,
                                      y = Object.values(d.queries.query);
                                    v < y.length;
                                    v++
                                  )
                                    for (
                                      var b,
                                        x,
                                        ee,
                                        S = 0,
                                        C = (b = y[v]).slice();
                                      S < C.length;
                                      S++
                                    )
                                      (x = C[S]).res != null &&
                                        s.mutatedParts &&
                                        (i && !x.dirty
                                          ? ((ee = Object.isFrozen(x.res)),
                                            (ee = sr(
                                              x.res,
                                              x.req,
                                              p,
                                              f,
                                              x,
                                              ee,
                                            )),
                                            x.dirty
                                              ? (ce(b, x),
                                                x.subscribers.forEach((e) =>
                                                  o.add(e),
                                                ))
                                              : ee !== x.res &&
                                                ((x.res = ee),
                                                (x.promise = A.resolve({
                                                  result: ee,
                                                }))))
                                          : (x.dirty && ce(b, x),
                                            x.subscribers.forEach((e) =>
                                              o.add(e),
                                            )));
                                }
                              }
                            }
                            o.forEach((e) => e());
                          }
                        })(!1),
                        { signal: i },
                      ),
                      s.addEventListener(`error`, o(!1), { signal: i }),
                      s.addEventListener(`complete`, o(!0), { signal: i })),
                    s
                  );
                },
                table: (r) => {
                  var i = e.table(r),
                    a = i.schema.primaryKey;
                  return t(t({}, i), {
                    mutate: (e) => {
                      var o,
                        s = k.trans;
                      return !a.outbound &&
                        s.db._options.cache !== `disabled` &&
                        !s.explicit &&
                        s.idbtrans.mode === `readwrite` &&
                        (o = Vn[`idb://${n}/${r}`])
                        ? ((s = i.mutate(e)),
                          (e.type !== `add` && e.type !== `put`) ||
                          !(
                            50 <= e.values.length ||
                            Qn(a, e).some((e) => e == null)
                          )
                            ? (o.optimisticOps.push(e),
                              e.mutatedParts && Wn(e.mutatedParts),
                              s.then((t) => {
                                0 < t.numFailures &&
                                  (ce(o.optimisticOps, e),
                                  (t = ar(0, e, t)) && o.optimisticOps.push(t),
                                  e.mutatedParts) &&
                                  Wn(e.mutatedParts);
                              }),
                              s.catch(() => {
                                ce(o.optimisticOps, e),
                                  e.mutatedParts && Wn(e.mutatedParts);
                              }))
                            : s.then((n) => {
                                var r = ar(
                                  0,
                                  t(t({}, e), {
                                    values: e.values.map((e, r) => {
                                      var i;
                                      return n.failures[r]
                                        ? e
                                        : (x(
                                            (i =
                                              (i = a.keyPath) != null &&
                                              i.includes(`.`)
                                                ? re(e)
                                                : t({}, e)),
                                            a.keyPath,
                                            n.results[r],
                                          ),
                                          i);
                                    }),
                                  }),
                                  n,
                                );
                                o.optimisticOps.push(r),
                                  queueMicrotask(
                                    () => e.mutatedParts && Wn(e.mutatedParts),
                                  );
                              }),
                          s)
                        : i.mutate(e);
                    },
                    query: (e) => {
                      var t, a, o, s, c, l, u;
                      return nr(k, i) && rr(`query`, e)
                        ? ((t =
                            (o = k.trans)?.db._options.cache === `immutable`),
                          (a = (o = k).requery),
                          (o = o.signal),
                          (l = ((e, t, n, r) => {
                            var i = Vn[`idb://${e}/${t}`];
                            if (!i) return [];
                            if (!(e = i.queries[n])) return [null, !1, i, null];
                            var a =
                              e[(r.query ? r.query.index.name : null) || ``];
                            if (!a) return [null, !1, i, null];
                            switch (n) {
                              case `query`: {
                                var o = (s = r.direction) ?? `next`,
                                  s = a.find(
                                    (e) =>
                                      e.req.limit === r.limit &&
                                      e.req.values === r.values &&
                                      (e.req.direction ?? `next`) === o &&
                                      cr(e.req.query.range, r.query.range),
                                  );
                                return s
                                  ? [s, !0, i, a]
                                  : [
                                      a.find(
                                        (e) =>
                                          (`limit` in e.req
                                            ? e.req.limit
                                            : 1 / 0) >= r.limit &&
                                          (e.req.direction ?? `next`) === o &&
                                          (!r.values || e.req.values) &&
                                          lr(e.req.query.range, r.query.range),
                                      ),
                                      !1,
                                      i,
                                      a,
                                    ];
                              }
                              case `count`:
                                return (
                                  (s = a.find((e) =>
                                    cr(e.req.query.range, r.query.range),
                                  )),
                                  [s, !!s, i, a]
                                );
                            }
                          })(n, r, `query`, e)),
                          (u = l[0]),
                          (s = l[2]),
                          (c = l[3]),
                          u && l[1]
                            ? (u.obsSet = e.obsSet)
                            : ((l = i
                                .query(e)
                                .then((e) => {
                                  var n = e.result;
                                  if ((u && (u.res = n), t)) {
                                    for (var r = 0, i = n.length; r < i; ++r)
                                      Object.freeze(n[r]);
                                    Object.freeze(n);
                                  }
                                  return e;
                                })
                                .catch(
                                  (e) => (
                                    c && u && ce(c, u), Promise.reject(e)
                                  ),
                                )),
                              (u = {
                                obsSet: e.obsSet,
                                promise: l,
                                subscribers: new Set(),
                                type: `query`,
                                req: e,
                                dirty: !1,
                              }),
                              c
                                ? c.push(u)
                                : ((c = [u]),
                                  ((s ||= Vn[`idb://${n}/${r}`] =
                                    {
                                      queries: { query: {}, count: {} },
                                      objs: new Map(),
                                      optimisticOps: [],
                                      unsignaledParts: {},
                                    }).queries.query[e.query.index.name || ``] =
                                    c))),
                          ur(u, c, a, o),
                          u.promise.then(
                            (n) => (
                              (n = sr(n.result, e, s?.optimisticOps, i, u, t)),
                              { result: t ? n : re(n) }
                            ),
                          ))
                        : i.query(e);
                    },
                  });
                },
              });
            },
          };
          function fr(e, t) {
            return new Proxy(e, {
              get: (e, n, r) => (n === `db` ? t : Reflect.get(e, n, r)),
            });
          }
          (U.prototype.version = function (e) {
            if (isNaN(e) || e < 0.1)
              throw new D.Type(`Given version is not a positive number`);
            if (
              ((e = Math.round(10 * e) / 10),
              this.idbdb || this._state.isBeingOpened)
            )
              throw new D.Schema(`Cannot add version when database is open`);
            this.verno = Math.max(this.verno, e);
            var t = this._versions,
              n = t.filter((t) => t._cfg.version === e)[0];
            return (
              n ||
                ((n = new this.Version(e)),
                t.push(n),
                t.sort(gn),
                n.stores({}),
                (this._state.autoSchema = !1)),
              n
            );
          }),
            (U.prototype._whenReady = function (e) {
              return this.idbdb &&
                (this._state.openComplete || k.letThrough || this._vip)
                ? e()
                : new A((e, n) => {
                    if (this._state.openComplete)
                      return n(new D.DatabaseClosed(this._state.dbOpenError));
                    if (!this._state.isBeingOpened) {
                      if (!this._state.autoOpen)
                        return void n(new D.DatabaseClosed());
                      this.open().catch(O);
                    }
                    this._state.dbReadyPromise.then(e, n);
                  }).then(e);
            }),
            (U.prototype.use = function (e) {
              var t = e.stack,
                n = e.create,
                r = e.level,
                e = e.name,
                i =
                  (e && this.unuse({ stack: t, name: e }),
                  this._middlewares[t] || (this._middlewares[t] = []));
              return (
                i.push({ stack: t, create: n, level: r ?? 10, name: e }),
                i.sort((e, t) => e.level - t.level),
                this
              );
            }),
            (U.prototype.unuse = function (e) {
              var t = e.stack,
                n = e.name,
                r = e.create;
              return (
                t &&
                  this._middlewares[t] &&
                  (this._middlewares[t] = this._middlewares[t].filter((e) =>
                    r ? e.create !== r : !!n && e.name !== n,
                  )),
                this
              );
            }),
            (U.prototype.open = function () {
              return mt(Ve, () => qn(this));
            }),
            (U.prototype._close = function () {
              this.on.close.fire(new CustomEvent(`close`));
              var e = this._state;
              if ((On.remove(this), this.idbdb)) {
                try {
                  this.idbdb.close();
                } catch {}
                this.idbdb = null;
              }
              e.isBeingOpened ||
                ((e.dbReadyPromise = new A((t) => {
                  e.dbReadyResolve = t;
                })),
                (e.openCanceller = new A((t, n) => {
                  e.cancelOpen = n;
                })));
            }),
            (U.prototype.close = function (e) {
              var e = (e === void 0 ? { disableAutoOpen: !0 } : e)
                  .disableAutoOpen,
                t = this._state;
              e
                ? (t.isBeingOpened && t.cancelOpen(new D.DatabaseClosed()),
                  this._close(),
                  (t.autoOpen = !1),
                  (t.dbOpenError = new D.DatabaseClosed()))
                : (this._close(),
                  (t.autoOpen = this._options.autoOpen || t.isBeingOpened),
                  (t.openComplete = !1),
                  (t.dbOpenError = null));
            }),
            (U.prototype.delete = function (e) {
              var t = this,
                n =
                  (e === void 0 && (e = { disableAutoOpen: !0 }),
                  0 < arguments.length && typeof arguments[0] != `object`),
                r = this._state;
              return new A((i, a) => {
                function o() {
                  t.close(e);
                  var n = t._deps.indexedDB.deleteDatabase(t.name);
                  (n.onsuccess = j(() => {
                    var e = t._deps,
                      n = t.name,
                      r;
                    An((r = e.indexedDB)) ||
                      n === yt ||
                      kn(r, e.IDBKeyRange).delete(n).catch(O),
                      i();
                  })),
                    (n.onerror = Yt(a)),
                    (n.onblocked = t._fireOnBlocked);
                }
                if (n)
                  throw new D.InvalidArgument(
                    `Invalid closeOptions argument to db.delete()`,
                  );
                r.isBeingOpened ? r.dbReadyPromise.then(o) : o();
              });
            }),
            (U.prototype.backendDB = function () {
              return this.idbdb;
            }),
            (U.prototype.isOpen = function () {
              return this.idbdb !== null;
            }),
            (U.prototype.hasBeenClosed = function () {
              var e = this._state.dbOpenError;
              return e && e.name === `DatabaseClosed`;
            }),
            (U.prototype.hasFailed = function () {
              return this._state.dbOpenError !== null;
            }),
            (U.prototype.dynamicallyOpened = function () {
              return this._state.autoSchema;
            }),
            Object.defineProperty(U.prototype, "tables", {
              get: function () {
                return i(this._allTables).map((t) => this._allTables[t]);
              },
              enumerable: !1,
              configurable: !0,
            }),
            (U.prototype.transaction = function () {
              var e = function (e, t, n) {
                var r = arguments.length;
                if (r < 2) throw new D.InvalidArgument(`Too few arguments`);
                for (var i = Array(r - 1); --r; ) i[r - 1] = arguments[r];
                return (n = i.pop()), [e, C(i), n];
              }.apply(this, arguments);
              return this._transaction.apply(this, e);
            }),
            (U.prototype._transaction = function (e, t, n) {
              var r,
                i,
                o = k.trans,
                s =
                  ((o && o.db === this && e.indexOf(`!`) === -1) || (o = null),
                  e.indexOf(`?`) !== -1);
              e = e.replace(`!`, ``).replace(`?`, ``);
              try {
                if (
                  ((i = t.map((e) => {
                    if (
                      ((e = e instanceof this.Table ? e.name : e),
                      typeof e != `string`)
                    )
                      throw TypeError(
                        `Invalid table argument to Dexie.transaction(). Only Table or String are allowed`,
                      );
                    return e;
                  })),
                  e == `r` || e === bt)
                )
                  r = bt;
                else {
                  if (e != `rw` && e != xt)
                    throw new D.InvalidArgument(
                      `Invalid transaction mode: ` + e,
                    );
                  r = xt;
                }
                if (o) {
                  if (o.mode === bt && r === xt) {
                    if (!s)
                      throw new D.SubTransaction(
                        `Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY`,
                      );
                    o = null;
                  }
                  o &&
                    i.forEach((e) => {
                      if (o && o.storeNames.indexOf(e) === -1) {
                        if (!s)
                          throw new D.SubTransaction(
                            `Table ` +
                              e +
                              ` not included in parent transaction.`,
                          );
                        o = null;
                      }
                    }),
                    s && o && !o.active && (o = null);
                }
              } catch (e) {
                return o
                  ? o._promise(null, (t, n) => {
                      n(e);
                    })
                  : N(e);
              }
              var c = function e(t, n, r, i, a) {
                return A.resolve().then(() => {
                  var o = k.transless || k,
                    s = t._createTransaction(n, r, t._dbSchema, i),
                    o = ((s.explicit = !0), { trans: s, transless: o });
                  if (i) s.idbtrans = i.idbtrans;
                  else
                    try {
                      s.create(),
                        (s.idbtrans._explicit = !0),
                        (t._state.PR1398_maxLoop = 3);
                    } catch (i) {
                      return i.name === ge.InvalidState &&
                        t.isOpen() &&
                        0 < --t._state.PR1398_maxLoop
                        ? (console.warn(`Dexie: Need to reopen db`),
                          t.close({ disableAutoOpen: !1 }),
                          t.open().then(() => e(t, n, r, null, a)))
                        : N(i);
                    }
                  var c,
                    l = ue(a),
                    o =
                      (l && ct(),
                      A.follow(() => {
                        var e;
                        (c = a.call(s, s)) &&
                          (l
                            ? ((e = lt.bind(null, null)), c.then(e, e))
                            : typeof c.next == `function` &&
                              typeof c.throw == `function` &&
                              (c = Jn(c)));
                      }, o));
                  return (
                    c && typeof c.then == `function`
                      ? A.resolve(c).then((e) =>
                          s.active
                            ? e
                            : N(
                                new D.PrematureCommit(
                                  `Transaction committed too early. See http://bit.ly/2kdckMn`,
                                ),
                              ),
                        )
                      : o.then(() => c)
                  )
                    .then(
                      (e) => (i && s._resolve(), s._completion.then(() => e)),
                    )
                    .catch((e) => (s._reject(e), N(e)));
                });
              }.bind(null, this, r, i, o, n);
              return o
                ? o._promise(r, c, `lock`)
                : k.trans
                  ? mt(k.transless, () => this._whenReady(c))
                  : this._whenReady(c);
            }),
            (U.prototype.table = function (e) {
              if (l(this._allTables, e)) return this._allTables[e];
              throw new D.InvalidTable(`Table ${e} does not exist`);
            });
          var pr = U;
          function U(e, n) {
            var r,
              i,
              a,
              o,
              s,
              c = this,
              l = ((this._middlewares = {}), (this.verno = 0), U.dependencies),
              l =
                ((this._options = n =
                  t(
                    {
                      addons: U.addons,
                      autoOpen: !0,
                      indexedDB: l.indexedDB,
                      IDBKeyRange: l.IDBKeyRange,
                      cache: `cloned`,
                      maxConnections: 1e3,
                    },
                    n,
                  )),
                (this._deps = {
                  indexedDB: n.indexedDB,
                  IDBKeyRange: n.IDBKeyRange,
                }),
                n.addons),
              u =
                ((this._dbSchema = {}),
                (this._versions = []),
                (this._storeNames = []),
                (this._allTables = {}),
                (this.idbdb = null),
                (this._novip = this),
                {
                  dbOpenError: null,
                  isBeingOpened: !1,
                  onReadyBeingFired: null,
                  openComplete: !1,
                  dbReadyResolve: O,
                  dbReadyPromise: null,
                  cancelOpen: O,
                  openCanceller: null,
                  autoSchema: !0,
                  PR1398_maxLoop: 3,
                  autoOpen: n.autoOpen,
                }),
              d =
                ((u.dbReadyPromise = new A((e) => {
                  u.dbReadyResolve = e;
                })),
                (u.openCanceller = new A((e, t) => {
                  u.cancelOpen = t;
                })),
                (this._state = u),
                (this.name = e),
                (this.on = L(
                  this,
                  `populate`,
                  `blocked`,
                  `versionchange`,
                  `close`,
                  { ready: [Ee, O] },
                )),
                (this.once = (e, t) => {
                  var n = function () {
                    for (var r = [], i = 0; i < arguments.length; i++)
                      r[i] = arguments[i];
                    c.on(e).unsubscribe(n), t.apply(c, r);
                  };
                  return c.on(e, n);
                }),
                (this.on.ready.subscribe = _(
                  this.on.ready.subscribe,
                  (e) => (t, n) => {
                    U.vip(() => {
                      var r,
                        i = c._state;
                      i.openComplete
                        ? (i.dbOpenError || A.resolve().then(t), n && e(t))
                        : i.onReadyBeingFired
                          ? (i.onReadyBeingFired.push(t), n && e(t))
                          : (e(t),
                            (r = c),
                            n ||
                              e(function e() {
                                r.on.ready.unsubscribe(t),
                                  r.on.ready.unsubscribe(e);
                              }));
                    });
                  },
                )),
                (this.Collection =
                  ((r = this),
                  Nt(Bt.prototype, function (e, t) {
                    this.db = r;
                    var n = Ct,
                      i = null;
                    if (t)
                      try {
                        n = t();
                      } catch (e) {
                        i = e;
                      }
                    var t = e._ctx,
                      e = t.table,
                      a = e.hook.reading.fire;
                    this._ctx = {
                      table: e,
                      index: t.index,
                      isPrimKey:
                        !t.index ||
                        (e.schema.primKey.keyPath &&
                          t.index === e.schema.primKey.name),
                      range: n,
                      keysOnly: !1,
                      dir: `next`,
                      unique: ``,
                      algorithm: null,
                      filter: null,
                      replayFilter: null,
                      justLimit: !0,
                      isMatch: null,
                      offset: 0,
                      limit: 1 / 0,
                      error: i,
                      or: t.or,
                      valueMapper: a === ye ? null : a,
                    };
                  }))),
                (this.Table =
                  ((i = this),
                  Nt(Mt.prototype, function (e, t, n) {
                    (this.db = i),
                      (this._tx = n),
                      (this.name = e),
                      (this.schema = t),
                      (this.hook = i._allTables[e]
                        ? i._allTables[e].hook
                        : L(null, {
                            creating: [Se, O],
                            reading: [be, ye],
                            updating: [we, O],
                            deleting: [Ce, O],
                          }));
                  }))),
                (this.Transaction =
                  ((a = this),
                  Nt(en.prototype, function (e, t, n, r, i) {
                    e !== `readonly` &&
                      t.forEach((e) => {
                        (e = (e = n[e])?.yProps),
                          e && (t = t.concat(e.map((e) => e.updatesTable)));
                      }),
                      (this.db = a),
                      (this.mode = e),
                      (this.storeNames = t),
                      (this.schema = n),
                      (this.chromeTransactionDurability = r),
                      (this.idbtrans = null),
                      (this.on = L(this, `complete`, `error`, `abort`)),
                      (this.parent = i || null),
                      (this.active = !0),
                      (this._reculock = 0),
                      (this._blockedFuncs = []),
                      (this._resolve = null),
                      (this._reject = null),
                      (this._waitingFor = null),
                      (this._waitingQueue = null),
                      (this._spinCount = 0),
                      (this._completion = new A((e, t) => {
                        (this._resolve = e), (this._reject = t);
                      })),
                      this._completion.then(
                        () => {
                          (this.active = !1), this.on.complete.fire();
                        },
                        (e) => {
                          var t = this.active;
                          return (
                            (this.active = !1),
                            this.on.error.fire(e),
                            this.parent
                              ? this.parent._reject(e)
                              : t && this.idbtrans && this.idbtrans.abort(),
                            N(e)
                          );
                        },
                      );
                  }))),
                (this.Version =
                  ((o = this),
                  Nt(En.prototype, function (e) {
                    (this.db = o),
                      (this._cfg = {
                        version: e,
                        storesSource: null,
                        dbschema: {},
                        tables: {},
                        contentUpgrade: null,
                      });
                  }))),
                (this.WhereClause =
                  ((s = this),
                  Nt(Jt.prototype, function (e, t, n) {
                    if (
                      ((this.db = s),
                      (this._ctx = {
                        table: e,
                        index: t === `:id` ? null : t,
                        or: n,
                      }),
                      (this._cmp = this._ascending = F),
                      (this._descending = (e, t) => F(t, e)),
                      (this._max = (e, t) => (0 < F(e, t) ? e : t)),
                      (this._min = (e, t) => (F(e, t) < 0 ? e : t)),
                      (this._IDBKeyRange = s._deps.IDBKeyRange),
                      !this._IDBKeyRange)
                    )
                      throw new D.MissingAPI();
                  }))),
                this.on(`versionchange`, (e) => {
                  0 < e.newVersion
                    ? console.warn(
                        `Another connection wants to upgrade database '${c.name}'. Closing db now to resume the upgrade.`,
                      )
                    : console.warn(
                        `Another connection wants to delete database '${c.name}'. Closing db now to resume the delete request.`,
                      ),
                    c.close({ disableAutoOpen: !1 });
                }),
                this.on(`blocked`, (e) => {
                  !e.newVersion || e.newVersion < e.oldVersion
                    ? console.warn(`Dexie.delete('${c.name}') was blocked`)
                    : console.warn(
                        `Upgrade '${c.name}' blocked by other connection holding version ${e.oldVersion / 10}`,
                      );
                }),
                (this._maxKey = on(n.IDBKeyRange)),
                (this._createTransaction = (e, t, n, r) =>
                  new c.Transaction(
                    e,
                    t,
                    n,
                    c._options.chromeTransactionDurability,
                    r,
                  )),
                (this._fireOnBlocked = (e) => {
                  c.on(`blocked`).fire(e),
                    On.toArray()
                      .filter(
                        (e) =>
                          e.name === c.name && e !== c && !e._state.vcFired,
                      )
                      .map((t) => t.on(`versionchange`).fire(e));
                }),
                this.use(tr),
                this.use(dr),
                this.use(ir),
                this.use(Xn),
                this.use($n),
                new Proxy(this, {
                  get: (e, t, n) => {
                    var r;
                    return (
                      t === `_vip` ||
                      (t === `table`
                        ? (e) => fr(c.table(e), d)
                        : (r = Reflect.get(e, t, n)) instanceof Mt
                          ? fr(r, d)
                          : t === `tables`
                            ? r.map((e) => fr(e, d))
                            : t === `_createTransaction`
                              ? function () {
                                  return fr(r.apply(this, arguments), d);
                                }
                              : r)
                    );
                  },
                }));
            (this.vip = d), l.forEach((e) => e(c));
          }
          var mr,
            Me =
              typeof Symbol < `u` && `observable` in Symbol
                ? Symbol.observable
                : `@@observable`,
            hr =
              ((gr.prototype.subscribe = function (e, t, n) {
                return this._subscribe(
                  e && typeof e != `function`
                    ? e
                    : { next: e, error: t, complete: n },
                );
              }),
              (gr.prototype[Me] = function () {
                return this;
              }),
              gr);
          function gr(e) {
            this._subscribe = e;
          }
          try {
            mr = {
              indexedDB:
                r.indexedDB ||
                r.mozIndexedDB ||
                r.webkitIndexedDB ||
                r.msIndexedDB,
              IDBKeyRange: r.IDBKeyRange || r.webkitIDBKeyRange,
            };
          } catch {
            mr = { indexedDB: null, IDBKeyRange: null };
          }
          function _r(e) {
            var t,
              n = !1,
              r = new hr((r) => {
                var i = ue(e),
                  a,
                  o = !1,
                  s = {},
                  c = {},
                  l = {
                    get closed() {
                      return o;
                    },
                    unsubscribe: () => {
                      o ||
                        ((o = !0),
                        a && a.abort(),
                        u && $t.storagemutated.unsubscribe(p));
                    },
                  },
                  u = (r.start && r.start(l), !1),
                  d = () => gt(m);
                function f() {
                  return Bn(c, s);
                }
                var p = (e) => {
                    zn(s, e), f() && d();
                  },
                  m = () => {
                    var l, m, h;
                    !o &&
                      mr.indexedDB &&
                      ((s = {}),
                      (l = {}),
                      a && a.abort(),
                      (a = new AbortController()),
                      (h = ((t) => {
                        var n = Qe();
                        try {
                          i && ct();
                          var r = st(e, t);
                          return (r = i ? r.finally(lt) : r);
                        } finally {
                          n && $e();
                        }
                      })(
                        (m = {
                          subscr: l,
                          signal: a.signal,
                          requery: d,
                          querier: e,
                          trans: null,
                        }),
                      )),
                      (u ||= ($t.storagemutated.subscribe(p), !0)),
                      Promise.resolve(h).then(
                        (e) => {
                          (n = !0),
                            (t = e),
                            o ||
                              m.signal.aborted ||
                              (f() || ((c = l), f())
                                ? d()
                                : ((s = {}),
                                  gt(() => !o && r.next && r.next(e))));
                        },
                        (e) => {
                          (n = !1),
                            [`DatabaseClosedError`, `AbortError`].includes(
                              e?.name,
                            ) ||
                              o ||
                              gt(() => {
                                o || (r.error && r.error(e));
                              });
                        },
                      ));
                  };
                return setTimeout(d, 0), l;
              });
            return (r.hasValue = () => n), (r.getValue = () => t), r;
          }
          var vr = pr;
          function yr(e) {
            var t = xr;
            try {
              (xr = !0), $t.storagemutated.fire(e), Gn(e, !0);
            } finally {
              xr = t;
            }
          }
          u(
            vr,
            t(t({}, w), {
              delete: (e) => new vr(e, { addons: [] }).delete(),
              exists: (e) =>
                new vr(e, { addons: [] })
                  .open()
                  .then((e) => (e.close(), !0))
                  .catch(`NoSuchDatabaseError`, () => !1),
              getDatabaseNames: (e) => {
                try {
                  return (
                    (t = vr.dependencies),
                    (n = t.indexedDB),
                    (t = t.IDBKeyRange),
                    (An(n)
                      ? Promise.resolve(n.databases()).then((e) =>
                          e.map((e) => e.name).filter((e) => e !== yt),
                        )
                      : kn(n, t).toCollection().primaryKeys()
                    ).then(e)
                  );
                } catch {
                  return N(new D.MissingAPI());
                }
                var t, n;
              },
              defineClass: () =>
                function (e) {
                  o(this, e);
                },
              ignoreTransaction: (e) =>
                k.trans ? mt(k.transless || Ve, e) : e(),
              vip: jn,
              async: (e) =>
                function () {
                  try {
                    var t = Jn(e.apply(this, arguments));
                    return t && typeof t.then == `function` ? t : A.resolve(t);
                  } catch (e) {
                    return N(e);
                  }
                },
              spawn: (e, t, n) => {
                try {
                  var r = Jn(e.apply(n, t || []));
                  return r && typeof r.then == `function` ? r : A.resolve(r);
                } catch (e) {
                  return N(e);
                }
              },
              currentTransaction: { get: () => k.trans || null },
              waitFor: (e, t) => (
                (e = A.resolve(
                  typeof e == `function` ? vr.ignoreTransaction(e) : e,
                ).timeout(t || 6e4)),
                k.trans ? k.trans.waitFor(e) : e
              ),
              Promise: A,
              debug: {
                get: () => De,
                set: (e) => {
                  Oe(e);
                },
              },
              derive: p,
              extend: o,
              props: u,
              override: _,
              Events: L,
              on: $t,
              liveQuery: _r,
              extendObservabilitySet: zn,
              getByKeyPath: b,
              setByKeyPath: x,
              delByKeyPath: (e, t) => {
                typeof t == `string`
                  ? x(e, t, void 0)
                  : `length` in t &&
                    [].map.call(t, (t) => {
                      x(e, t, void 0);
                    });
              },
              shallowClone: ee,
              deepClone: re,
              getObjectDiff: Zn,
              cmp: F,
              asap: y,
              minKey: -1 / 0,
              addons: [],
              connections: { get: On.toArray },
              errnames: ge,
              dependencies: mr,
              cache: Vn,
              semVer: `4.4.4`,
              version: `4.4.4`
                .split(`.`)
                .map((e) => parseInt(e))
                .reduce((e, t, n) => e + t / 10 ** (2 * n)),
            }),
          ),
            (vr.maxKey = on(vr.dependencies.IDBKeyRange)),
            typeof dispatchEvent < `u` &&
              typeof addEventListener < `u` &&
              ($t(Zt, (e) => {
                xr ||=
                  ((e = new CustomEvent(Qt, { detail: e })),
                  (xr = !0),
                  dispatchEvent(e),
                  !1);
              }),
              addEventListener(Qt, (e) => {
                (e = e.detail), xr || yr(e);
              }));
          var br,
            xr = !1,
            Sr = () => {};
          return (
            typeof BroadcastChannel < `u` &&
              ((Sr = () => {
                (br = new BroadcastChannel(Qt)).onmessage = (e) =>
                  e.data && yr(e.data);
              })(),
              typeof br.unref == `function` && br.unref(),
              $t(Zt, (e) => {
                xr || br.postMessage(e);
              })),
            typeof addEventListener < `u` &&
              (addEventListener(`pagehide`, (e) => {
                if (!pr.disableBfCache && e.persisted) {
                  De && console.debug(`Dexie: handling persisted pagehide`),
                    br?.close();
                  for (var t = 0, n = On.toArray(); t < n.length; t++)
                    n[t].close({ disableAutoOpen: !1 });
                }
              }),
              addEventListener(`pageshow`, (e) => {
                !pr.disableBfCache &&
                  e.persisted &&
                  (De && console.debug(`Dexie: handling persisted pageshow`),
                  Sr(),
                  yr({ all: new H(-1 / 0, [[]]) }));
              })),
            (A.rejectionMapper = (e, t) =>
              !e ||
              e instanceof fe ||
              e instanceof TypeError ||
              e instanceof SyntaxError ||
              !e.name ||
              !ve[e.name]
                ? e
                : ((t = new ve[e.name](t || e.message, e)),
                  `stack` in e &&
                    f(t, `stack`, {
                      get: function () {
                        return this.inner.stack;
                      },
                    }),
                  t)),
            Oe(De),
            t(
              pr,
              Object.freeze({
                __proto__: null,
                DEFAULT_MAX_CONNECTIONS: 1e3,
                Dexie: pr,
                Entity: Tt,
                PropModification: kt,
                RangeSet: H,
                add: (e) => new kt({ add: e }),
                cmp: F,
                default: pr,
                liveQuery: _r,
                mergeRanges: Pn,
                rangesOverlap: Fn,
                remove: (e) => new kt({ remove: e }),
                replacePrefix: (e, t) => new kt({ replacePrefix: [e, t] }),
              }),
              { default: pr },
            ),
            pr
          );
        });
      })(),
      1,
    ),
    Bo = Symbol.for(`Dexie`),
    Vo = globalThis[Bo] || (globalThis[Bo] = zo.default);
  if (zo.default.semVer !== Vo.semVer)
    throw Error(
      `Two different versions of Dexie loaded in the same app: ${zo.default.semVer} and ${Vo.semVer}`,
    );
  var {
      liveQuery: Ho,
      mergeRanges: Uo,
      rangesOverlap: Wo,
      RangeSet: Go,
      cmp: Ko,
      Entity: qo,
      PropModification: Jo,
      replacePrefix: Yo,
      add: Xo,
      remove: Zo,
      DexieYProvider: Qo,
    } = Vo,
    $o = class extends Vo {
      drafts;
      attempts;
      wordStats;
      questionProgress;
      questions;
      snapshots;
      sessions;
      settings;
      meta;
      constructor(e) {
        super(e),
          this.version(1).stores({
            drafts: `&[predictionEdition+questionId], predictionEdition, questionId, updatedAt`,
            attempts: `&attemptId, questionId, completedAt`,
            outbox: `&attemptId, status, nextAttemptAt, batchId, leaseExpiresAt`,
            wordStats: `&key, expected, lastSeenAt`,
            questionProgress: `&[predictionEdition+questionId], predictionEdition, questionId, dueAt, marked`,
            questions: `&[predictionEdition+questionId], predictionEdition, questionId, sitePosition`,
            snapshots: `&predictionEdition`,
            sessions: `&id, predictionEdition, questionId, updatedAt`,
            settings: `&id, updatedAt`,
            meta: `&id`,
          }),
          this.version(2)
            .stores({ outbox: null })
            .upgrade((e) =>
              e
                .table(`meta`)
                .bulkDelete([`projection-instance-id`, `projection-version`]),
            );
      }
    },
    es = (e = `pte-pilot-facts-v1`) => new $o(e),
    ts = 6e4,
    ns = 60 * ts,
    rs = 24 * ns,
    is = 30 * ts,
    as = 6 * ns,
    os = [rs, 2 * rs, 4 * rs, 7 * rs];
  function ss(e) {
    const t = Date.parse(e.completedAt);
    if (!Number.isFinite(t)) throw Error(`review:invalid-completed-at`);
    const n = Math.max(0, Math.floor(e.previousStreak));
    if (e.accuracy < 0.8) return { streak: 0, dueAt: cs(t + is) };
    if (e.accuracy < 1) return { streak: n, dueAt: cs(t + as) };
    const r = n + 1;
    return { streak: r, dueAt: cs(t + (os[Math.min(r, os.length) - 1] ?? rs)) };
  }
  function cs(e) {
    return new Date(e).toISOString();
  }
  var ls = 3600 * 1e3,
    us = (e, t) => [e, t],
    ds = (e) =>
      [
        e.type,
        e.expected.toLocaleLowerCase(`en-AU`),
        e.actual.toLocaleLowerCase(`en-AU`),
      ].join(`\0`);
  function fs(e) {
    const t = Date.parse(e);
    if (!Number.isFinite(t)) throw Error(`invalid timestamp`);
    return t;
  }
  var ps = class {
    db;
    clock;
    constructor(e, t = Date.now) {
      (this.db = e), (this.clock = t);
    }
    async loadDraft(e, t) {
      return (await this.db.drafts.get(us(e, t))) ?? null;
    }
    async saveDraft(e) {
      const t = go.parse(e);
      await this.db.transaction(`rw`, this.db.drafts, async () => {
        const e = us(t.predictionEdition, t.questionId),
          n = await this.db.drafts.get(e);
        (!n || t.revision > n.revision) && (await this.db.drafts.put(t));
      });
    }
    async saveSession(e, t = new Date(this.clock()).toISOString()) {
      const n = co.parse(e);
      fs(t);
      const r = { id: `current`, ...n, updatedAt: t };
      await this.db.sessions.put(r);
    }
    async restoreSession() {
      const e = await this.db.sessions.get(`current`);
      return e
        ? {
            question: co.parse({
              questionId: e.questionId,
              predictionEdition: e.predictionEdition,
              position: e.position,
              total: e.total,
            }),
            draft: await this.loadDraft(e.predictionEdition, e.questionId),
          }
        : { question: null, draft: null };
    }
    async commitAttempt(e, t) {
      const n = mo.parse(t);
      await this.db.transaction(
        `rw`,
        [
          this.db.attempts,
          this.db.wordStats,
          this.db.questionProgress,
          this.db.meta,
          this.db.sessions,
        ],
        async () => {
          const t = await this.db.sessions.get(`current`);
          if (t?.predictionEdition !== e || t.questionId !== n.questionId)
            throw Error(`attempt does not match verified current session`);
          if (await this.db.attempts.get(n.attemptId)) return;
          await this.db.attempts.add(n);
          const r = us(e, n.questionId),
            i = await this.db.questionProgress.get(r),
            a = ss({
              accuracy: n.accuracy,
              completedAt: n.completedAt,
              previousStreak: i?.streak ?? 0,
            }),
            o = {
              predictionEdition: e,
              questionId: n.questionId,
              attemptCount: (i?.attemptCount ?? 0) + 1,
              errorCount: (i?.errorCount ?? 0) + n.errors.length,
              lastAccuracy: n.accuracy,
              lastAttemptAt: n.completedAt,
              dueAt: a.dueAt,
              marked: i?.marked ?? !1,
              streak: a.streak,
            };
          await this.db.questionProgress.put(o);
          for (const e of n.errors) {
            const t = ds(e),
              r = await this.db.wordStats.get(t),
              i = {
                key: t,
                expected: e.expected,
                actual: e.actual,
                type: e.type,
                occurrences: (r?.occurrences ?? 0) + 1,
                lastSeenAt: n.completedAt,
              };
            await this.db.wordStats.put(i);
          }
          await this.incrementLearnerStateVersion();
        },
      );
    }
    async setMarked(e, t, n) {
      await this.db.transaction(
        `rw`,
        [this.db.questionProgress, this.db.meta],
        async () => {
          const r = us(e, t),
            i = await this.db.questionProgress.get(r);
          i?.marked !== n &&
            (await this.db.questionProgress.put({
              predictionEdition: e,
              questionId: t,
              attemptCount: i?.attemptCount ?? 0,
              errorCount: i?.errorCount ?? 0,
              lastAccuracy: i?.lastAccuracy ?? null,
              lastAttemptAt: i?.lastAttemptAt ?? null,
              dueAt: i?.dueAt ?? null,
              marked: n,
              streak: i?.streak ?? 0,
            }),
            await this.incrementLearnerStateVersion());
        },
      );
    }
    async matchVerifiedEdition(e) {
      const t = (await this.db.snapshots.toArray()).filter(
        (t) =>
          t.completeness === `complete` &&
          t.siteTotal === e.total &&
          t.orderedQuestionIds[e.position - 1] === e.questionId,
      );
      return t.length === 1 ? (t[0]?.predictionEdition ?? null) : null;
    }
    async listCandidateFacts(e) {
      return (
        await this.db.questionProgress
          .where(`predictionEdition`)
          .equals(e)
          .toArray()
      )
        .sort((e, t) => e.questionId.localeCompare(t.questionId, `en`))
        .map((e) => ({
          questionId: e.questionId,
          dueAt: e.dueAt,
          attemptCount: e.attemptCount,
          errorCount: e.errorCount,
          lastAccuracy: e.lastAccuracy,
          lastAttemptAt: e.lastAttemptAt,
          marked: e.marked,
        }));
    }
    async getRankCandidates(e, t) {
      const n = [...new Set(t)];
      if (n.length === 0 || n.length > 500)
        throw Error(`rank candidate count must be between 1 and 500`);
      return this.db.transaction(
        `r`,
        [this.db.questionProgress, this.db.meta],
        async () => {
          const t = await this.db.questionProgress.bulkGet(
              n.map((t) => us(e, t)),
            ),
            r = this.clock(),
            i = n.map((e, n) => {
              const i = t[n];
              return {
                questionId: e,
                dueScore: i?.dueAt
                  ? Math.min(
                      1,
                      Math.max(0, (r - Date.parse(i.dueAt)) / (24 * ls) + 0.5),
                    )
                  : 1,
                weaknessScore: i
                  ? Math.min(1, i.errorCount / Math.max(1, i.attemptCount * 3))
                  : 0,
                noveltyScore: +!i,
                marked: i?.marked ?? !1,
                attemptCount: i?.attemptCount ?? 0,
                lastAttemptAt: i?.lastAttemptAt ?? null,
              };
            });
          return {
            learnerStateVersion:
              (await this.db.meta.get(`learner-state-version`))?.numberValue ??
              0,
            candidates: i,
          };
        },
      );
    }
    async loadIndexSnapshot(e) {
      const t = (await this.db.snapshots.get(e)) ?? null,
        n = new Set(t?.orderedQuestionIds ?? []);
      return {
        snapshot: t,
        questions: (
          await this.db.questions
            .where(`predictionEdition`)
            .equals(e)
            .sortBy(`sitePosition`)
        ).filter((e) => n.has(e.questionId)),
      };
    }
    async saveIndexSnapshot(e, t) {
      const n = uo.parse(e),
        r = t.map((e) => lo.parse(e));
      if (
        r.some(
          (e) =>
            e.predictionEdition !== n.predictionEdition ||
            e.siteTotal !== n.siteTotal ||
            !n.orderedQuestionIds.includes(e.questionId),
        )
      )
        throw Error(`index write does not match snapshot`);
      if (n.completeness === `complete`) {
        const e = [...r].sort((e, t) => e.sitePosition - t.sitePosition),
          t = e.map((e) => e.questionId),
          i = e.every((e, t) => e.sitePosition === t + 1);
        if (
          r.length !== n.siteTotal ||
          !i ||
          t.some((e, t) => e !== n.orderedQuestionIds[t])
        )
          throw Error(`complete index must cover ordered positions 1..N`);
      }
      await this.db.transaction(
        `rw`,
        [this.db.snapshots, this.db.questions],
        async () => {
          await this.db.questions
            .where(`predictionEdition`)
            .equals(n.predictionEdition)
            .delete(),
            await this.db.questions.bulkPut(r),
            await this.db.snapshots.put(n);
        },
      );
    }
    async loadSettings() {
      const e = await this.db.settings.get(`current`);
      return e ? xo.parse(e) : null;
    }
    async saveSettings(e) {
      await this.db.settings.put(xo.parse(e));
    }
    async listWordStats(e) {
      if (!Number.isInteger(e) || e < 1 || e > 500)
        throw Error(`word stat limit must be between 1 and 500`);
      return (await this.db.wordStats.toArray())
        .sort(
          (e, t) =>
            t.lastSeenAt.localeCompare(e.lastSeenAt) ||
            e.key.localeCompare(t.key, `en`),
        )
        .slice(0, e);
    }
    async incrementLearnerStateVersion() {
      const e = await this.db.meta.get(`learner-state-version`);
      await this.db.meta.put({
        id: `learner-state-version`,
        numberValue: (e?.numberValue ?? 0) + 1,
      });
    }
  };
  async function ms(e, t = {}) {
    const n = t.clock ?? Date.now,
      r = es(t.databaseName),
      i = new ps(r, n),
      a = Lo({ extensionId: e.runtime.id, repository: i }),
      o = (e, t) => a(e, t);
    return (
      e.runtime.onMessage.addListener(o),
      () => {
        e.runtime.onMessage.removeListener(o), r.close();
      }
    );
  }
  var hs = u(() => {
      ms(l).catch(() => {});
    }),
    gs = {
      debug: (...e) => ([...e], void 0),
      log: (...e) => ([...e], void 0),
      warn: (...e) => ([...e], void 0),
      error: (...e) => ([...e], void 0),
    },
    _s;
  try {
    (_s = hs.main()),
      _s instanceof Promise &&
        console.warn(
          `The background's main() function return a promise, but it must be synchronous`,
        );
  } catch (e) {
    throw (gs.error(`The background crashed on startup!`), e);
  }
  return _s;
})();

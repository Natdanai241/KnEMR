/* ============================================================
   saas-shell.jsx — multi-tenant layer for คลินิกเวชกรรมแพทย์ณัฐดนัย
   Loaded AFTER React/ReactDOM/supabase-js, BEFORE clinic-dashboard.js.
   Exposes window.SaaSRootRouter (mounted by index.html's boot script)
   and window.__sb / window.__TENANT__ (read by clinic-dashboard.js's
   supa helper for tenant-scoped requests).
   ============================================================ */
(function () {
  const SUPABASE_URL = "https://lozyfwydyrovxjtsgybn.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxvenlmd3lkeXJvdnhqdHNneWJuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMyMzAyNDcsImV4cCI6MjA5ODgwNjI0N30.i2QfDgm9NkNb0E7JIUh_4hnVYpLVt6pwslTuzUb4UA8";

  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.__sb = sb;
  window.__TENANT__ = { clinicId: null, accessToken: null };

  const PDPA_VERSION = "1.0";
  const h = React.createElement;

  const COLORS = { primary: "#1a5276", primaryDark: "#154360", bg: "#f0f4f8", danger: "#e74c3c" };

  const btnStyle = {
    background: COLORS.primary, color: "#fff", border: "none", borderRadius: 8,
    padding: "12px 20px", fontSize: 15, fontWeight: 600, cursor: "pointer", width: "100%",
  };
  const inputStyle = {
    width: "100%", padding: "11px 12px", borderRadius: 8, border: "1px solid #cbd5e1",
    fontSize: 15, marginBottom: 12, fontFamily: "'Sarabun', sans-serif",
  };
  const cardStyle = {
    background: "#fff", borderRadius: 14, padding: "28px 26px", maxWidth: 420, width: "calc(100% - 40px)",
    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
  };
  const shellWrap = {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: `linear-gradient(160deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    fontFamily: "'Sarabun', sans-serif", padding: 20,
  };

  function ErrBox({ msg }) {
    if (!msg) return null;
    return h("div", { style: { background: "#fdecea", color: "#c0392b", padding: "10px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 } }, msg);
  }

  function BootScreen({ label }) {
    return h("div", { style: shellWrap },
      h("div", { style: { textAlign: "center", color: "#fff" } },
        h("div", { style: { fontSize: 56, marginBottom: 12 } }, "🏥"),
        h("div", { style: { fontWeight: 700, fontSize: 18 } }, "คลินิกเวชกรรมแพทย์ณัฐดนัย"),
        h("div", { style: { fontSize: 13, opacity: 0.75, marginTop: 6 } }, label || "กำลังโหลดระบบ...")
      )
    );
  }

  // ---------------- Auth (login / clinic onboarding / join clinic) ----------------
  function AuthScreen({ onAuthed }) {
    const [mode, setMode] = React.useState("login");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [fullName, setFullName] = React.useState("");
    const [clinicName, setClinicName] = React.useState("");
    const [joinCode, setJoinCode] = React.useState("");
    const [notice, setNotice] = React.useState("");
    const [err, setErr] = React.useState("");
    const [busy, setBusy] = React.useState(false);

    async function doLogin() {
      setBusy(true); setErr("");
      try {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthed();
      } catch (e) { setErr(e.message || String(e)); }
      finally { setBusy(false); }
    }

    async function doOnboard() {
      setBusy(true); setErr("");
      try {
        const { data: su, error: e1 } = await sb.auth.signUp({
          email, password, options: { data: { full_name: fullName, intent: "onboard", clinic_name: clinicName } }
        });
        if (e1) throw e1;
        if (su.session) { onAuthed(); }
        else { setNotice("สมัครสำเร็จ กรุณายืนยันอีเมล แล้วกลับมาเข้าสู่ระบบอีกครั้ง"); setMode("login"); }
      } catch (e) { setErr(e.message || String(e)); }
      finally { setBusy(false); }
    }

    async function doJoin() {
      setBusy(true); setErr("");
      try {
        const slug = joinCode.trim().toLowerCase();
        const { data: clinic, error: ce } = await sb.from("clinics").select("id").eq("slug", slug).maybeSingle();
        if (ce) throw ce;
        if (!clinic) throw new Error("ไม่พบรหัสคลินิกนี้");

        const { data: su, error: e1 } = await sb.auth.signUp({
          email, password, options: { data: { full_name: fullName, intent: "join", clinic_slug: slug } }
        });
        if (e1) throw e1;
        if (su.session) { onAuthed(); }
        else { setNotice("ลงทะเบียนสำเร็จ กรุณายืนยันอีเมล แล้วเข้าสู่ระบบเพื่อรอการอนุมัติ"); setMode("login"); }
      } catch (e) { setErr(e.message || String(e)); }
      finally { setBusy(false); }
    }

    const tabs = [["login", "เข้าสู่ระบบ"], ["onboard", "เปิดคลินิกใหม่"], ["join", "เข้าร่วมคลินิก"]];

    return h("div", { style: shellWrap },
      h("div", { style: cardStyle },
        h("div", { style: { fontSize: 40, textAlign: "center", marginBottom: 4 } }, "🏥"),
        h("div", { style: { fontWeight: 700, fontSize: 17, textAlign: "center", marginBottom: 18, color: "#1a5276" } }, "คลินิกเวชกรรมแพทย์ณัฐดนัย"),
        h("div", { style: { display: "flex", gap: 6, marginBottom: 16 } },
          tabs.map(([k, label]) => h("button", {
            key: k, onClick: () => { setMode(k); setErr(""); },
            style: { flex: 1, padding: "8px 4px", fontSize: 12.5, borderRadius: 8, border: "1px solid #cbd5e1", cursor: "pointer",
              background: mode === k ? COLORS.primary : "#fff", color: mode === k ? "#fff" : "#333" }
          }, label))
        ),
        notice && h("div", { style: { background: "#eafaf1", color: "#1e8449", padding: "10px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 } }, notice),
        h(ErrBox, { msg: err }),
        mode !== "login" && h("input", { style: inputStyle, placeholder: "ชื่อ-นามสกุล", value: fullName, onChange: e => setFullName(e.target.value) }),
        mode === "onboard" && h("input", { style: inputStyle, placeholder: "ชื่อคลินิก", value: clinicName, onChange: e => setClinicName(e.target.value) }),
        mode === "join" && h("input", { style: inputStyle, placeholder: "รหัสคลินิก (จากแพทย์)", value: joinCode, onChange: e => setJoinCode(e.target.value) }),
        h("input", { style: inputStyle, type: "email", placeholder: "อีเมล", value: email, onChange: e => setEmail(e.target.value) }),
        h("input", { style: inputStyle, type: "password", placeholder: "รหัสผ่าน", value: password, onChange: e => setPassword(e.target.value) }),
        h("button", {
          style: { ...btnStyle, opacity: busy ? 0.6 : 1 }, disabled: busy,
          onClick: mode === "login" ? doLogin : mode === "onboard" ? doOnboard : doJoin,
        }, busy ? "กำลังดำเนินการ..." : mode === "login" ? "เข้าสู่ระบบ" : mode === "onboard" ? "สร้างคลินิกและเริ่มทดลองใช้" : "ลงทะเบียนเข้าร่วม")
      )
    );
  }

  // ---------------- PDPA ----------------
  const PDPA_TEXT = [
    "คลินิกฯ เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลของท่านเพื่อการให้บริการทางการแพทย์ การนัดหมาย การเงิน และการปฏิบัติตามกฎหมาย",
    "ท่านมีสิทธิขอเข้าถึง แก้ไข หรือขอให้ลบข้อมูลส่วนบุคคลของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562",
    "การกดยอมรับถือว่าท่านรับทราบและยินยอมให้ระบบจัดเก็บข้อมูลดังกล่าวสำหรับการใช้งานระบบคลินิก",
  ];
  function PDPAModal({ onAccept }) {
    const [checked, setChecked] = React.useState(false);
    const [busy, setBusy] = React.useState(false);
    return h("div", { style: shellWrap },
      h("div", { style: cardStyle },
        h("div", { style: { fontWeight: 700, fontSize: 17, marginBottom: 12 } }, "ความยินยอมการใช้ข้อมูลส่วนบุคคล (PDPA)"),
        PDPA_TEXT.map((t, i) => h("p", { key: i, style: { fontSize: 13.5, lineHeight: 1.7, marginBottom: 10, color: "#333" } }, t)),
        h("label", { style: { display: "flex", alignItems: "flex-start", gap: 8, margin: "14px 0", fontSize: 13.5 } },
          h("input", { type: "checkbox", checked, onChange: e => setChecked(e.target.checked), style: { marginTop: 3 } }),
          "ข้าพเจ้าได้อ่านและยินยอมตามข้อตกลงข้างต้น"
        ),
        h("button", {
          style: { ...btnStyle, opacity: (!checked || busy) ? 0.5 : 1 }, disabled: !checked || busy,
          onClick: async () => { setBusy(true); await onAccept(); setBusy(false); },
        }, busy ? "กำลังบันทึก..." : "ยอมรับและดำเนินการต่อ")
      )
    );
  }

  // ---------------- Gate screens ----------------
  function GateScreen({ title, body, showSignOut }) {
    return h("div", { style: shellWrap },
      h("div", { style: cardStyle },
        h("div", { style: { fontWeight: 700, fontSize: 17, marginBottom: 10, color: COLORS.danger } }, title),
        h("p", { style: { fontSize: 14, lineHeight: 1.7, color: "#333", marginBottom: 16 } }, body),
        showSignOut && h("button", { style: btnStyle, onClick: () => sb.auth.signOut().then(() => window.location.reload()) }, "ออกจากระบบ")
      )
    );
  }

  // ---------------- Super Admin portal ----------------
  function SuperAdminPortal() {
    const [tab, setTab] = React.useState("clinics");
    const [clinics, setClinics] = React.useState([]);
    const [subs, setSubs] = React.useState([]);
    const [plans, setPlans] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    async function loadAll() {
      setLoading(true);
      const [c, s, p] = await Promise.all([
        sb.from("clinics").select("*").order("created_at", { ascending: false }),
        sb.from("clinic_subscriptions").select("*, plans(name,code)"),
        sb.from("plans").select("*").order("price_thb"),
      ]);
      setClinics(c.data || []); setSubs(s.data || []); setPlans(p.data || []);
      setLoading(false);
    }
    React.useEffect(() => { loadAll(); }, []);

    async function toggleClinicStatus(clinic) {
      const next = clinic.status === "active" ? "suspended" : "active";
      await sb.from("clinics").update({ status: next }).eq("id", clinic.id);
      loadAll();
    }
    async function setSubStatus(clinicId, status) {
      await sb.from("clinic_subscriptions").update({ status }).eq("clinic_id", clinicId);
      loadAll();
    }

    const subFor = (clinicId) => subs.find(s => s.clinic_id === clinicId);

    return h("div", { style: { minHeight: "100vh", background: COLORS.bg, fontFamily: "'Sarabun', sans-serif" } },
      h("div", { style: { background: COLORS.primary, color: "#fff", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" } },
        h("div", { style: { fontWeight: 700 } }, "🛠 Super Admin"),
        h("button", { onClick: () => sb.auth.signOut().then(() => window.location.reload()), style: { background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.5)", borderRadius: 6, padding: "6px 12px", cursor: "pointer" } }, "ออกจากระบบ")
      ),
      h("div", { style: { display: "flex", gap: 8, padding: "14px 20px" } },
        ["clinics", "plans"].map(k => h("button", {
          key: k, onClick: () => setTab(k),
          style: { padding: "8px 16px", borderRadius: 8, border: "1px solid #cbd5e1", cursor: "pointer",
            background: tab === k ? COLORS.primary : "#fff", color: tab === k ? "#fff" : "#333" }
        }, k === "clinics" ? "คลินิก" : "แผนราคา"))
      ),
      loading ? h("div", { style: { padding: 20 } }, "กำลังโหลด...") :
      tab === "clinics" ? h("div", { style: { padding: "0 20px 20px" } },
        h("table", { style: { width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 10, overflow: "hidden" } },
          h("thead", null, h("tr", { style: { background: "#e2e8f0", textAlign: "left" } },
            ["ชื่อคลินิก", "สถานะคลินิก", "แผน", "สถานะสมัครสมาชิก", ""].map((c, i) => h("th", { key: i, style: { padding: 10, fontSize: 13 } }, c))
          )),
          h("tbody", null, clinics.map(c => {
            const s = subFor(c.id);
            return h("tr", { key: c.id, style: { borderTop: "1px solid #eee" } },
              h("td", { style: { padding: 10, fontSize: 13.5 } }, c.name),
              h("td", { style: { padding: 10, fontSize: 13.5, color: c.status === "active" ? "#1e8449" : "#c0392b" } }, c.status),
              h("td", { style: { padding: 10, fontSize: 13.5 } }, s ? (s.plans ? s.plans.name : s.plan_id) : "-"),
              h("td", { style: { padding: 10, fontSize: 13.5 } },
                s ? h("select", {
                  value: s.status, onChange: e => setSubStatus(c.id, e.target.value),
                  style: { fontSize: 13 }
                }, ["trialing", "active", "past_due", "expired", "cancelled"].map(v => h("option", { key: v, value: v }, v))) : "-"
              ),
              h("td", { style: { padding: 10 } }, h("button", {
                onClick: () => toggleClinicStatus(c),
                style: { fontSize: 12.5, padding: "6px 10px", borderRadius: 6, border: "1px solid #cbd5e1", cursor: "pointer",
                  background: c.status === "active" ? "#fdecea" : "#eafaf1", color: c.status === "active" ? "#c0392b" : "#1e8449" }
              }, c.status === "active" ? "ระงับ" : "เปิดใช้งาน"))
            );
          }))
        )
      ) :
      h("div", { style: { padding: "0 20px 20px", display: "flex", gap: 14, flexWrap: "wrap" } },
        plans.map(p => h("div", { key: p.id, style: { background: "#fff", borderRadius: 10, padding: 16, minWidth: 180 } },
          h("div", { style: { fontWeight: 700 } }, p.name),
          h("div", { style: { fontSize: 13, color: "#666", marginTop: 4 } }, "฿" + p.price_thb + "/เดือน"),
          h("div", { style: { fontSize: 12.5, color: "#999", marginTop: 4 } }, "staff ≤ " + (p.max_staff ?? "ไม่จำกัด") + " · patients ≤ " + (p.max_patients ?? "ไม่จำกัด"))
        ))
      )
    );
  }

  function BootstrapForm({ onDone }) {
    const [fullName, setFullName] = React.useState("");
    const [email, setEmail] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [notice, setNotice] = React.useState("");
    const [err, setErr] = React.useState("");
    const [busy, setBusy] = React.useState(false);

    async function doBootstrap() {
      setBusy(true); setErr("");
      try {
        const { data: su, error: e1 } = await sb.auth.signUp({
          email, password, options: { data: { full_name: fullName, intent: "bootstrap" } }
        });
        if (e1) throw e1;
        if (su.session) { onDone(); }
        else { setNotice("สมัครสำเร็จ กรุณายืนยันอีเมล แล้วกลับมาเข้าสู่ระบบอีกครั้ง"); }
      } catch (e) { setErr(e.message || String(e)); }
      finally { setBusy(false); }
    }

    return h("div", { style: shellWrap },
      h("div", { style: cardStyle },
        h("div", { style: { fontSize: 40, textAlign: "center", marginBottom: 4 } }, "🛠"),
        h("div", { style: { fontWeight: 700, fontSize: 17, textAlign: "center", marginBottom: 6, color: "#1a5276" } }, "ตั้งค่าระบบครั้งแรก"),
        h("div", { style: { fontSize: 13, textAlign: "center", color: "#666", marginBottom: 16 } }, "ยังไม่มีผู้ดูแลระบบ — บัญชีนี้จะเป็น Super Admin"),
        notice && h("div", { style: { background: "#eafaf1", color: "#1e8449", padding: "10px 12px", borderRadius: 8, fontSize: 13, marginBottom: 12 } }, notice),
        h(ErrBox, { msg: err }),
        h("input", { style: inputStyle, placeholder: "ชื่อ-นามสกุล", value: fullName, onChange: e => setFullName(e.target.value) }),
        h("input", { style: inputStyle, type: "email", placeholder: "อีเมล", value: email, onChange: e => setEmail(e.target.value) }),
        h("input", { style: inputStyle, type: "password", placeholder: "รหัสผ่าน", value: password, onChange: e => setPassword(e.target.value) }),
        h("button", { style: { ...btnStyle, opacity: busy ? 0.6 : 1 }, disabled: busy, onClick: doBootstrap }, busy ? "กำลังดำเนินการ..." : "สร้างบัญชี Super Admin")
      )
    );
  }

  // ---------------- Root router ----------------
  function RootRouter() {
    const [state, setState] = React.useState({ phase: "loading" });

    async function enterAuth() {
      let noAdminYet = false;
      try {
        const { data } = await sb.rpc("super_admin_exists");
        noAdminYet = data === false;
      } catch (_) {}
      setState({ phase: noAdminYet ? "bootstrap" : "auth" });
    }

    async function loadAll(session) {
      let { data: profile } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();

      if (!profile) {
        const meta = session.user.user_metadata || {};
        try {
          if (meta.intent === "bootstrap") {
            const { data: noAdmin } = await sb.rpc("super_admin_exists");
            if (noAdmin === false) {
              const { data: created } = await sb.from("profiles")
                .insert({ id: session.user.id, clinic_id: null, full_name: meta.full_name, role: "super_admin", status: "approved" })
                .select().maybeSingle();
              profile = created;
            }
          } else if (meta.intent === "onboard" && meta.clinic_name) {
            const slug = meta.clinic_name.toLowerCase().trim().replace(/[^a-z0-9ก-๙-]+/g, "-").replace(/(^-|-$)/g, "") || ("clinic-" + Date.now());
            const { data: clinic } = await sb.from("clinics").insert({ name: meta.clinic_name, slug, status: "active" }).select().single();
            if (clinic) {
              const { data: created } = await sb.from("profiles")
                .insert({ id: session.user.id, clinic_id: clinic.id, full_name: meta.full_name, role: "doctor", status: "approved" })
                .select().maybeSingle();
              profile = created;
              const { data: trialPlan } = await sb.from("plans").select("id").eq("code", "trial").single();
              const trialEnds = new Date(Date.now() + 14 * 86400000).toISOString();
              await sb.from("clinic_subscriptions").insert({ clinic_id: clinic.id, plan_id: trialPlan.id, status: "trialing", trial_ends_at: trialEnds, current_period_end: trialEnds });
            }
          } else if (meta.intent === "join" && meta.clinic_slug) {
            const { data: clinic } = await sb.from("clinics").select("id").eq("slug", meta.clinic_slug).maybeSingle();
            if (clinic) {
              const { data: created } = await sb.from("profiles")
                .insert({ id: session.user.id, clinic_id: clinic.id, full_name: meta.full_name, role: "staff", status: "pending" })
                .select().maybeSingle();
              profile = created;
            }
          }
        } catch (_) {}
      }

      if (!profile) { enterAuth(); return; }

      window.__TENANT__.clinicId = profile.clinic_id;
      window.__TENANT__.accessToken = session.access_token;

      if (profile.role === "super_admin") { setState({ phase: "super-admin" }); return; }
      if (profile.status === "pending") { setState({ phase: "pending" }); return; }
      if (profile.status === "suspended") { setState({ phase: "user-suspended" }); return; }

      const { data: clinic } = await sb.from("clinics").select("*").eq("id", profile.clinic_id).maybeSingle();
      if (clinic && clinic.status === "suspended") { setState({ phase: "clinic-suspended" }); return; }

      if (!profile.pdpa_consented_at) { setState({ phase: "pdpa", profile }); return; }

      const { data: subscription } = await sb.from("clinic_subscriptions").select("*").eq("clinic_id", profile.clinic_id).maybeSingle();
      if (subscription && ["expired", "cancelled"].includes(subscription.status)) { setState({ phase: "billing", subscription }); return; }

      // Bridge into the existing localStorage-based session the dashboard already expects —
      // this lets clinic-dashboard.jsx/AppRoot mount completely unchanged.
      try {
        localStorage.setItem("clinic_session_v1", JSON.stringify({
          id: profile.id, name: profile.full_name || session.user.email, username: session.user.email,
          role: profile.role === "doctor" ? "doctor" : profile.role === "nurse" ? "nurse" : "staff",
          status: "active",
        }));
      } catch (_) {}

      setState({ phase: "app" });
    }

    React.useEffect(() => {
      sb.auth.getSession().then(({ data }) => { if (data.session) loadAll(data.session); else enterAuth(); });
      const { data: sub } = sb.auth.onAuthStateChange((_e, session) => {
        if (session) loadAll(session); else { try { localStorage.removeItem("clinic_session_v1"); } catch (_) {} enterAuth(); }
      });
      return () => sub.subscription.unsubscribe();
    }, []);

    async function acceptPDPA() {
      const { data } = await sb.auth.getSession();
      const uid = data.session.user.id;
      await sb.from("profiles").update({ pdpa_consented_at: new Date().toISOString(), pdpa_version: PDPA_VERSION }).eq("id", uid);
      await sb.from("consent_records").insert({ profile_id: uid, clinic_id: state.profile.clinic_id, pdpa_version: PDPA_VERSION, user_agent: navigator.userAgent });
      loadAll(data.session);
    }

    switch (state.phase) {
      case "loading": return h(BootScreen, {});
      case "bootstrap": return h(BootstrapForm, { onDone: () => sb.auth.getSession().then(({ data }) => loadAll(data.session)) });
      case "auth": return h(AuthScreen, { onAuthed: () => sb.auth.getSession().then(({ data }) => loadAll(data.session)) });
      case "pending": return h(GateScreen, { title: "รอการอนุมัติ", body: "บัญชีของท่านลงทะเบียนสำเร็จแล้ว กรุณารอแพทย์ประจำคลินิกอนุมัติก่อนเข้าใช้งาน", showSignOut: true });
      case "user-suspended": return h(GateScreen, { title: "บัญชีถูกระงับ", body: "บัญชีของท่านถูกระงับการใช้งาน กรุณาติดต่อแพทย์ประจำคลินิก", showSignOut: true });
      case "clinic-suspended": return h(GateScreen, { title: "คลินิกถูกระงับ", body: "คลินิกนี้ถูกระงับการใช้งานชั่วคราว กรุณาติดต่อผู้ดูแลระบบ", showSignOut: true });
      case "billing": return h(GateScreen, { title: "การสมัครสมาชิกหมดอายุ", body: "แผนการใช้งานของคลินิกหมดอายุหรือถูกยกเลิก กรุณาติดต่อผู้ดูแลระบบเพื่อต่ออายุ", showSignOut: true });
      case "pdpa": return h(PDPAModal, { onAccept: acceptPDPA });
      case "super-admin": return h(SuperAdminPortal, {});
      case "app": return h(window.AppRoot);
      default: return h(BootScreen, {});
    }
  }

  window.SaaSRootRouter = RootRouter;
})();

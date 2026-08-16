import React, { useEffect, useMemo, useRef, useState } from "react";
import heroBannerUrl from "../hero-banner.png";

const apiBase = import.meta.env.VITE_API_BASE || "";

type Project = {
  id: string;
  projectNumber: number;
  projectName: string;
  teamName: string;
  teamMembers: string[];
  oneLiner: string;
  targetUsers: string;
  applicationScenarios: string;
  coreFeatures: string;
  demoUrl: string;
  demoInstructions: string;
  demoVideoUrl: string;
  demoHardwareVideoUrl: string;
  pitchSourceUrl: string;
  pitchPdfUrl: string;
  pitchHtmlUrl: string;
  prototypeThreeViewsUrl: string;
  posterUrl: string;
  posterBoothUrl: string;
  posterPrintConfirmed: boolean;
  vidmuseFeedbackTags: string[];
  vidmuseFeedbackNote: string;
  vidmuseFutureInterest: string;
  marketingChannels: string[];
  tuyaPostUrl: string;
  tuyaPostConfirmed: boolean;
  digikeyPostUrl: string;
  digikeyPostConfirmed: boolean;
  digikeyMaterials: string;
  demoVideoMarketingUrl: string;
  demoVideoPlaybackConfirmed: boolean;
  status: string;
  isPublic: boolean;
  votingEnabled: boolean;
  createdAt: string;
  updatedAt: string;
};

type ProjectForm = Omit<Project, "id" | "projectNumber" | "status" | "isPublic" | "votingEnabled" | "createdAt" | "updatedAt">;

type VotingConfig = {
  isOpen: boolean;
  startsAt: string | null;
  endsAt: string | null;
};

type VoterIdentity = { phone: string };
type VotingCandidate = { id: string; name: string; number: number; validVotes?: number };
type SubmissionUploadKind = "pitch-source" | "pitch-pdf" | "pitch-html" | "prototype-three-views" | "poster-a4" | "poster-booth";
type UploadedSubmissionFile = { url: string; fileName: string };
type JuryDimension = { key: string; label: string; english: string; max: number };
type JuryTeam = { key: string; name: string; number: number };
type JuryScore = { id: string; judgeName: string; teamKey: string; scores: Record<string, number>; total: number; createdAt: string; updatedAt: string };
type JuryScoringConfig = { judges: string[]; teams: JuryTeam[]; dimensions: JuryDimension[] };
type JuryTeamStat = { key: string; name: string; number: number; scoreCount: number; averageTotal: number | null; averages: Record<string, number | null> };
type JuryDashboardData = JuryScoringConfig & { scoreCount: number; judgeProgress: Array<{ name: string; completedTeams: number; totalTeams: number }>; teamStats: JuryTeamStat[]; scores: JuryScore[] };

const emptyProject: ProjectForm = {
  projectName: "",
  teamName: "",
  teamMembers: [],
  oneLiner: "",
  targetUsers: "",
  applicationScenarios: "",
  coreFeatures: "",
  demoUrl: "",
  demoInstructions: "",
  demoVideoUrl: "",
  demoHardwareVideoUrl: "",
  pitchSourceUrl: "",
  pitchPdfUrl: "",
  pitchHtmlUrl: "",
  prototypeThreeViewsUrl: "",
  posterUrl: "",
  posterBoothUrl: "",
  posterPrintConfirmed: false,
  vidmuseFeedbackTags: [],
  vidmuseFeedbackNote: "",
  vidmuseFutureInterest: "",
  marketingChannels: [],
  tuyaPostUrl: "",
  tuyaPostConfirmed: false,
  digikeyPostUrl: "",
  digikeyPostConfirmed: false,
  digikeyMaterials: "",
  demoVideoMarketingUrl: "",
  demoVideoPlaybackConfirmed: false,
};

const vidmuseFeedbackOptions = [
  "帮我更快开始创作",
  "有些功能不够顺手",
  "希望增加新的功能或场景",
  "暂时没有特别感受",
];

const vidmuseFutureInterestOptions = ["非常愿意继续使用", "愿意继续使用", "暂时不确定", "暂时不考虑"];
const posterSubmissionDeadline = new Date("2026-08-15T14:30:00+08:00").getTime();

const requiredProjectTextFields = [
  "projectName",
  "teamName",
  "oneLiner",
  "targetUsers",
  "applicationScenarios",
  "coreFeatures",
  "demoUrl",
  "demoInstructions",
  "demoVideoUrl",
  "demoHardwareVideoUrl",
  "pitchPdfUrl",
  "prototypeThreeViewsUrl",
] as const;

const projectFieldLabels: Record<string, string> = {
  projectName: "项目名称",
  teamName: "团队名称",
  oneLiner: "一句话介绍",
  targetUsers: "目标用户",
  applicationScenarios: "应用场景",
  coreFeatures: "核心功能",
  demoUrl: "GitHub 链接",
  demoInstructions: "Demo 操作说明",
  demoVideoUrl: "Demo 产品概念视频",
  demoHardwareVideoUrl: "Demo 硬件实物视频",
  pitchPdfUrl: "Pitch PPT PDF 备份",
  prototypeThreeViewsUrl: "硬件实物 / 原型（三视图）",
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new Error(data.error || "请求失败，请稍后重试");
  return data as T;
}

async function uploadSubmissionFile(kind: SubmissionUploadKind, file: File): Promise<UploadedSubmissionFile> {
  const formData = new FormData();
  formData.set("kind", kind);
  formData.set("file", file);
  const response = await fetch(`${apiBase}/api/submission-files`, { method: "POST", body: formData });
  const data = (await response.json().catch(() => ({}))) as { error?: string; url?: string; fileName?: string };
  if (!response.ok || !data.url || !data.fileName) throw new Error(data.error || "文件上传失败，请稍后重试");
  return { url: data.url, fileName: data.fileName };
}

function EventShell(props: { kicker: string; title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="page event-page">
      <header className="hero event-hero"><img className="hero-image" src={heroBannerUrl} alt="Herstory 女性硬件黑客松" /></header>
      <section className="section section--lead event-lead">
        <div className="lead-copy">
          <div className="lead-kicker">{props.kicker}</div>
          <h1 className="lead-title">{props.title}</h1>
          <p className="lead-desc">{props.description}</p>
        </div>
      </section>
      {props.children}
      <footer className="site-credit">by 一点海椰 from HsHH</footer>
    </div>
  );
}

function EventField(props: { label?: string; hint?: string; children: React.ReactNode }) {
  return <div className="field">{props.label ? <label>{props.label}</label> : null}{props.children}{props.hint ? <div className="hint">{props.hint}</div> : null}</div>;
}

function UploadField(props: {
  label?: string;
  hint: string;
  kind: SubmissionUploadKind;
  accept: string;
  value: string;
  onUploaded: (file: UploadedSubmissionFile) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [fileName, setFileName] = useState("");

  const upload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    setMessage("");
    try {
      const uploaded = await uploadSubmissionFile(props.kind, file);
      props.onUploaded(uploaded);
      setFileName(uploaded.fileName);
      setMessage("上传完成");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "文件上传失败");
    } finally {
      setUploading(false);
    }
  };

  return (
    <EventField label={props.label} hint={props.hint}>
      <div className="upload-field">
        <input className="upload-input" type="file" accept={props.accept} aria-label={props.label || "上传 A4 产品宣发海报电子版"} onChange={(event) => void upload(event)} disabled={uploading} />
        {props.value ? <div className="upload-status is-ready">已上传：{fileName || "当前版本"}</div> : null}
        {message ? <div className={`upload-status ${message === "上传完成" ? "is-ready" : "is-error"}`} role="status">{message}</div> : null}
      </div>
    </EventField>
  );
}

function CopyButton(props: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(props.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };
  return <button className="btn" type="button" onClick={() => void copy()}>{copied ? "已复制" : props.label}</button>;
}

function EventSection(props: { index: string; badge?: string; title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="section event-section">
      <div className="section-head">
        <div className="section-head__text"><div className="index">{props.index}</div><h2>{props.title}</h2>{props.description ? <p>{props.description}</p> : null}</div>
        <div className="section-badge">{props.badge || props.index.split("/")[0].trim().slice(-2)}</div>
      </div>
      {props.children}
    </section>
  );
}

function TextAreaList(props: { value: string[]; onChange: (value: string[]) => void; placeholder: string }) {
  return <textarea value={props.value.join("\n")} onChange={(event) => props.onChange(event.target.value.split("\n").map((value) => value.trim()).filter(Boolean))} placeholder={props.placeholder} />;
}

export function ProjectSubmissionPage() {
  const [form, setForm] = useState<ProjectForm>(() => {
    try { return { ...emptyProject, ...JSON.parse(localStorage.getItem("hshh-project-submission-draft") || "{}") }; } catch { return emptyProject; }
  });
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState<"poster" | "materials" | null>(null);
  const [posterFeedback, setPosterFeedback] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [step, setStep] = useState<1 | 2>(1);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (message) messageRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [message]);

  useEffect(() => { localStorage.setItem("hshh-project-submission-draft", JSON.stringify(form)); }, [form]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const set = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => setForm((current) => ({ ...current, [key]: value }));
  const posterSubmissionClosed = now >= posterSubmissionDeadline;

  const submitMaterials = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage("");
    if (form.teamMembers.length === 0 || requiredProjectTextFields.some((key) => !form[key].trim())) {
      const missing = requiredProjectTextFields.filter((key) => !form[key].trim()).map((key) => projectFieldLabels[key] || key);
      if (form.teamMembers.length === 0) missing.unshift("团队成员");
      setMessage(`还有必填项未完成：${missing.join("、")}。请先返回上一步补齐后，再提交。`);
      setStep(1);
      return;
    }
    if (!form.vidmuseFeedbackTags.length || !form.vidmuseFutureInterest || !form.vidmuseFeedbackNote.trim()) {
      setMessage("请完成 VidMuse 使用小记中的两项选择题和文字反馈。");
      return;
    }
    if (!form.marketingChannels.length) {
      setMessage("请至少选择一种产品内容宣发方式。");
      return;
    }
    if (form.marketingChannels.includes("tuya") && (!form.tuyaPostUrl.trim() || !form.tuyaPostConfirmed)) {
      setMessage("请填写方式一（涂鸦智能小红书宣发）帖子链接，并确认帖子可以正常访问。");
      return;
    }
    if (form.marketingChannels.includes("digikey") && (!form.digikeyPostUrl.trim() || !form.digikeyPostConfirmed)) {
      setMessage("请填写方式二（DigiKey 社区宣发）帖子链接，并确认帖子可以正常访问。");
      return;
    }
    if (!form.demoVideoMarketingUrl.trim() || !form.demoVideoPlaybackConfirmed) {
      setMessage("请填写小红书 Demo 视频链接，并确认视频可以正常播放。");
      return;
    }
    setSubmitting("materials");
    try {
      await request<{ project: Project }>("/api/projects", { method: "POST", body: JSON.stringify(form) });
      setMessage("项目材料已提交。海报请在上方单独提交，并于截止时间前完成。");
    } catch (error) { setMessage(error instanceof Error ? error.message : "提交失败"); } finally { setSubmitting(null); }
  };

  const goNext = () => {
    setMessage("");
    if (form.teamMembers.length === 0 || requiredProjectTextFields.some((key) => !form[key].trim())) {
      const missing = requiredProjectTextFields.filter((key) => !form[key].trim()).map((key) => projectFieldLabels[key] || key);
      if (form.teamMembers.length === 0) missing.unshift("团队成员");
      setMessage(`还有必填项未完成：${missing.join("、")}。`);
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitPosters = async () => {
    setMessage("");
    setPosterFeedback(null);
    // if (posterSubmissionClosed) {
    //   setPosterFeedback({ kind: "error", text: "两版电子海报提交已于 8 月 15 日 14:00 截止。" });
    //   return;
    // }
    if (!form.projectName.trim() || !form.teamName.trim()) {
      setPosterFeedback({ kind: "error", text: "请先填写项目名称和团队名称，再提交海报。" });
      return;
    }
    if (!form.posterUrl || !form.posterBoothUrl || !form.posterPrintConfirmed) {
      setPosterFeedback({ kind: "error", text: "请上传两版电子海报，并确认会携带两种规格的纸质海报。" });
      return;
    }
    setSubmitting("poster");
    try {
      await request<{ project: Project }>("/api/projects/posters", { method: "POST", body: JSON.stringify(form) });
      setPosterFeedback({ kind: "success", text: "两版海报已提交。可继续填写作品材料；如需替换海报，重新上传后再次提交即可。" });
    } catch (error) { setPosterFeedback({ kind: "error", text: error instanceof Error ? error.message : "海报提交失败" }); } finally { setSubmitting(null); }
  };

  return (
    <EventShell kicker="project.submit()" title="赛事作品提交" description="海报与项目材料分开提交：两版海报须于 8 月 15 日 14:00 前完成，作品材料须于 8 月 16 日 16:00 前完成。相同团队名称会合并为同一项目。">
      <form className="event-form" noValidate onSubmit={submitMaterials}>
        {step === 1 ? (
          <>
        <EventSection index="01 / POSTER" title="基本信息" description="先提交两版海报即可；只需要填写下方的项目名称和团队名称，用于后续合并作品材料。">
          {/* <div className="deadline-banner" role="note"><span>两版电子海报提交截止</span><strong>8 月 15 日 14:00</strong><p>请在截止前上传 A4 与展位尺寸电子版；逾期海报无法进入全场 Dashboard 和路演展位展示。</p>{posterSubmissionClosed ? <b className="deadline-banner__closed">提交已截止</b> : null}</div> */}
          <div className="qa-stack">
            <div className="grid-2 project-info-grid">
              <EventField label="项目名称 *"><input value={form.projectName} onChange={(event) => set("projectName", event.target.value.slice(0, 80))} required /></EventField>
              <EventField label="团队名称 *" hint="这是两次提交的共同标识，请保持一致。"><input value={form.teamName} onChange={(event) => set("teamName", event.target.value.slice(0, 80))} required /></EventField>
            </div>
            {/* <UploadField label="A4 产品宣发海报电子版 *" hint="适配笔记本电脑尺寸；支持 JPG / PNG / WebP，最大 10MB。" kind="poster-a4" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" value={form.posterUrl} onUploaded={({ url }) => set("posterUrl", url)} />
            <UploadField label="展位产品宣发海报电子版 *" hint="规格 0.8m × 2m，用于路演当天展位展示；支持 JPG / PNG / WebP，最大 10MB。" kind="poster-booth" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" value={form.posterBoothUrl} onUploaded={({ url }) => set("posterBoothUrl", url)} /> */}
            {/* <label className="choice event-confirm"><input type="checkbox" checked={form.posterPrintConfirmed} onChange={(event) => set("posterPrintConfirmed", event.target.checked)} /><span>我确认已准备 A4 规格及 0.8m × 2m 规格的纸质海报。 *</span></label> */}
            {/* <div className="section-submit"><button className="btn primary" type="button" onClick={() => void submitPosters()} disabled={submitting !== null || posterSubmissionClosed}>{submitting === "poster" ? "海报提交中" : posterSubmissionClosed ? "海报提交已截止" : "提交两版海报"}</button><span>海报单独保存，不需要等待 Demo、视频或路演材料完成。</span></div> */}
            {/* {posterFeedback ? <div className={`section-feedback is-${posterFeedback.kind}`} role={posterFeedback.kind === "error" ? "alert" : "status"}>{posterFeedback.text}</div> : null} */}
          </div>
        </EventSection>
        <EventSection index="02 / PROJECT" title="项目信息" description="海报已提交后，再补充作品信息，让评委和现场观众快速理解妳们要解决的问题与作品价值。">
          <div className="qa-stack">
            <EventField label="团队成员 *" hint="每行一位成员，可附角色。"><TextAreaList value={form.teamMembers} onChange={(value) => set("teamMembers", value)} placeholder="姓名 / 角色" /></EventField>
            <EventField label="一句话介绍 *"><input value={form.oneLiner} onChange={(event) => set("oneLiner", event.target.value.slice(0, 180))} placeholder="用一句话说清作品解决什么问题" required /></EventField>
            <div className="grid-2 project-info-grid">
              <EventField label="目标用户 *"><textarea value={form.targetUsers} onChange={(event) => set("targetUsers", event.target.value)} placeholder="谁会使用它？" required /></EventField>
              <EventField label="应用场景 *"><textarea value={form.applicationScenarios} onChange={(event) => set("applicationScenarios", event.target.value)} placeholder="在什么真实场景中发生？" required /></EventField>
            </div>
            <EventField label="核心功能 *"><textarea value={form.coreFeatures} onChange={(event) => set("coreFeatures", event.target.value)} placeholder="列出已经完成、可展示的核心功能" required /></EventField>
          </div>
        </EventSection>
        <EventSection index="03 / DEMO" title="项目材料" description="请确保现场工作人员和评委可以直接打开、理解并演示作品。">
          <div className="qa-stack">
            <EventField label="GitHub 链接 *"><input type="url" value={form.demoUrl} onChange={(event) => set("demoUrl", event.target.value.trim())} placeholder="https://..." required /></EventField>
            <EventField label="Demo 操作说明 *"><textarea value={form.demoInstructions} onChange={(event) => set("demoInstructions", event.target.value)} placeholder="从打开链接到展示核心功能的操作步骤；如依赖硬件或本地环境，请写清楚。" required /></EventField>
            <UploadField label="硬件实物 / 原型（三视图）*" hint="请清楚展示正、侧、俯视图；支持 JPG / PNG / WebP / PDF，最大 20MB。" kind="prototype-three-views" accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf" value={form.prototypeThreeViewsUrl} onUploaded={({ url }) => set("prototypeThreeViewsUrl", url)} />
            <EventField label="Demo 产品概念视频 *" hint="3 分钟以内，展示核心功能与实际效果；提供可正常访问的视频链接即可。"><input type="url" value={form.demoVideoUrl} onChange={(event) => set("demoVideoUrl", event.target.value.trim())} placeholder="https://..." required /></EventField>
            <EventField label="Demo 硬件实物视频 *" hint="实物操作展示，展示硬件实物运行效果；提供可正常访问的视频链接即可。"><input type="url" value={form.demoHardwareVideoUrl} onChange={(event) => set("demoHardwareVideoUrl", event.target.value.trim())} placeholder="https://..." required /></EventField>
          </div>
        </EventSection>
        <EventSection index="04 / MATERIALS" title="路演材料" description="确保所有路演的材料都涵盖在内。">
          <div className="qa-stack">
            <div className="grid-2">
              <UploadField label="Pitch PPT 原文件" hint="选传；支持 PPT / PPTX / Key，最大 30MB。" kind="pitch-source" accept=".ppt,.pptx,.key,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation" value={form.pitchSourceUrl} onUploaded={({ url }) => set("pitchSourceUrl", url)} />
              <UploadField label="Pitch PPT PDF 备份 *" hint="仅支持 PDF，最大 20MB。" kind="pitch-pdf" accept=".pdf,application/pdf" value={form.pitchPdfUrl} onUploaded={({ url }) => set("pitchPdfUrl", url)} />
            </div>
            <UploadField label="Pitch HTML 文件" hint="选传；支持 HTML / HTM，最大 30MB。" kind="pitch-html" accept=".html,.htm,text/html" value={form.pitchHtmlUrl} onUploaded={({ url }) => set("pitchHtmlUrl", url)} />
          </div>
        </EventSection>
          </>
        ) : (
        <EventSection index="05 / MARKETING" title="产品市场宣发" description="请完成产品内容的宣发信息，便于组委会核验宣发完成情况。">
          <div className="qa-stack">
            <div className="marketing-part">
              <div className="marketing-part__head"><h3>一、产品内容宣发（多选，必选）</h3><p>请选择一种适用于本项目的发布方式：</p></div>
              <div className="qa-options" aria-label="产品内容宣发方式">
                <label className="choice"><input type="checkbox" checked={form.marketingChannels.includes("tuya")} onChange={(event) => set("marketingChannels", event.target.checked ? [...form.marketingChannels, "tuya"] : form.marketingChannels.filter((item) => item !== "tuya"))} /><span>方式一：涂鸦智能小红书宣发</span></label>
                <label className="choice"><input type="checkbox" checked={form.marketingChannels.includes("digikey")} onChange={(event) => set("marketingChannels", event.target.checked ? [...form.marketingChannels, "digikey"] : form.marketingChannels.filter((item) => item !== "digikey"))} /><span>方式二：DigiKey 社区宣发</span></label>
              </div>
              <div className="hint">同时使用涂鸦智能硬件和 DigiKey 物料的团队，任选一种完成即可。</div>
            </div>
            {form.marketingChannels.includes("tuya") ? (
              <div className="marketing-part">
                <div className="marketing-part__head"><h3>方式一：涂鸦智能小红书宣发</h3><p>适用于使用涂鸦智能硬件的项目。</p></div>
                <div className="digikey-copy-row"><div className="digikey-title">#涂鸦智能 #涂鸦开发者 #T5AI #HsHH</div><CopyButton text="#涂鸦智能 #HsHH" label="复制标签" /></div>
                <EventField label="小红书帖子链接 *"><input type="url" value={form.tuyaPostUrl} onChange={(event) => set("tuyaPostUrl", event.target.value.trim())} placeholder="https://www.xiaohongshu.com/explore/..." required /></EventField>
                <label className="choice event-confirm"><input type="checkbox" checked={form.tuyaPostConfirmed} onChange={(event) => set("tuyaPostConfirmed", event.target.checked)} /><span>已确认帖子可以正常访问 *</span></label>
              </div>
            ) : null}
            {form.marketingChannels.includes("digikey") ? (
              <div className="marketing-part">
                <div className="marketing-part__head"><h3>方式二：DigiKey 社区宣发</h3><p>适用于使用 DigiKey 物料的项目。发布网站：DigiKey 技术论坛。</p></div>
                <EventField label="标题">
                  <div className="digikey-copy-row"><div className="digikey-title">{`【Herstory 女性硬件黑客松】${form.projectName}`}</div><CopyButton text={`【Herstory 女性硬件黑客松】${form.projectName}`} label="复制标题" /></div>
                </EventField>
                <EventField label="正文一键复制模板">
                  <pre className="digikey-body">{`项目名称：${form.projectName}\n团队名称：${form.teamName}\n团队成员：${form.teamMembers.join("、")}\n一句话介绍：${form.oneLiner}\n目标用户：${form.targetUsers}\n应用场景：${form.applicationScenarios}\n核心功能：${form.coreFeatures}\n使用的 DigiKey 物料：${form.digikeyMaterials}\nDemo：${form.demoUrl}`}</pre>
                  <div className="digikey-copy-row"><CopyButton text={`项目名称：${form.projectName}\n团队名称：${form.teamName}\n团队成员：${form.teamMembers.join("、")}\n一句话介绍：${form.oneLiner}\n目标用户：${form.targetUsers}\n应用场景：${form.applicationScenarios}\n核心功能：${form.coreFeatures}\n使用的 DigiKey 物料：${form.digikeyMaterials}\nDemo：${form.demoUrl}`} label="复制正文" /><a className="btn inline-link" href="https://forum.digikey.com/" target="_blank" rel="noreferrer">前往 DigiKey 发布</a></div>
                </EventField>
                <EventField label="使用的 DigiKey 物料（名称及型号）"><input value={form.digikeyMaterials} onChange={(event) => set("digikeyMaterials", event.target.value.slice(0, 200))} placeholder="如：ESP32-C3 开发板 ×2、温湿度传感器 ×1" /></EventField>
                <EventField label="DigiKey 帖子链接 *"><input type="url" value={form.digikeyPostUrl} onChange={(event) => set("digikeyPostUrl", event.target.value.trim())} placeholder="https://forum.digikey.com/t/..." required /></EventField>
                <label className="choice event-confirm"><input type="checkbox" checked={form.digikeyPostConfirmed} onChange={(event) => set("digikeyPostConfirmed", event.target.checked)} /><span>已确认帖子可以正常访问 *</span></label>
              </div>
            ) : null}
            <div className="marketing-part">
              <div className="marketing-part__head"><h3>二、Demo 视频宣发</h3><p>请将 Pitch 使用的 Demo 视频发布至小红书，并添加以下标签：</p></div>
              <div className="digikey-copy-row"><div className="digikey-title">#HsHH #vidmuse</div><CopyButton text="#HsHH #vidmuse" label="复制标签" /></div>
              <div className="vidmuse-feedback">
                <div className="vidmuse-feedback__head">
                  <h3>VidMuse 使用小记</h3>
                  <p>想听听它在这次创作中哪些地方帮上了忙，或哪些地方还可以更好。所有回答都不会影响作品评审、展示或后续权益。</p>
                </div>
                <div className="choice-title">这次使用 VidMuse 的感受（可多选） *</div>
                <div className="qa-options" aria-label="VIDMUSE 使用反馈标签">
                  {vidmuseFeedbackOptions.map((option) => (
                    <label className="choice" key={option}>
                      <input
                        type="checkbox"
                        checked={form.vidmuseFeedbackTags.includes(option)}
                        onChange={(event) => set("vidmuseFeedbackTags", event.target.checked
                          ? [...form.vidmuseFeedbackTags, option]
                          : form.vidmuseFeedbackTags.filter((item) => item !== option))}
                      />
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
                <EventField label="未来对 VidMuse 的使用意愿 *">
                  <div className="qa-options">
                    {vidmuseFutureInterestOptions.map((option) => <label className="choice" key={option}><input type="radio" name="vidmuseFutureInterest" checked={form.vidmuseFutureInterest === option} onChange={() => set("vidmuseFutureInterest", option)} /><span>{option}</span></label>)}
                  </div>
                </EventField>
                <EventField label="想补充一句吗？ *"><textarea value={form.vidmuseFeedbackNote} onChange={(event) => set("vidmuseFeedbackNote", event.target.value.slice(0, 1000))} placeholder="请写出该产品最优之处和最令人吐槽之处" required /></EventField>
              </div>
              <EventField label="小红书 Demo 视频链接 *"><input type="url" value={form.demoVideoMarketingUrl} onChange={(event) => set("demoVideoMarketingUrl", event.target.value.trim())} placeholder="https://www.xiaohongshu.com/explore/..." required /></EventField>
              <label className="choice event-confirm"><input type="checkbox" checked={form.demoVideoPlaybackConfirmed} onChange={(event) => set("demoVideoPlaybackConfirmed", event.target.checked)} /><span>已确认视频可以正常播放 *</span></label>
              <div className="hint">如果已通过方式一发布 Demo 视频，可直接填写同一个小红书链接，无需重复发布。</div>
            </div>
          </div>
        </EventSection>
        )}
        {message ? <div className="event-message" role="alert" ref={messageRef}>{message}</div> : null}
        <div className="event-actions">{step === 1 ? <><a className="btn inline-link" href="/dashboard">查看全场 Dashboard</a><button className="btn primary" type="button" onClick={goNext} disabled={submitting !== null}>下一步：产品宣发</button></> : <><button className="btn" type="button" onClick={() => setStep(1)} disabled={submitting !== null}>上一步</button><button className="btn primary" type="submit" disabled={submitting !== null}>{submitting === "materials" ? "材料提交中" : "提交项目材料"}</button></>}</div>
      </form>
    </EventShell>
  );
}

export function EventDashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const submitted = new URLSearchParams(window.location.search).has("submitted");
  useEffect(() => {
    void request<{ projects: Project[] }>("/api/dashboard").then((data) => setProjects(data.projects)).catch((error: Error) => setError(error.message)).finally(() => setLoading(false));
  }, []);
  return (
    <EventShell kicker="event.dashboard()" title="HsHH 全场 Dashboard" description="这里汇总已公开的参赛项目。评分排名不在公开页面展示，最终结果由组委会确认。">
      {submitted ? <section className="event-notice"><strong>项目材料已保存。</strong><span>妳的团队作品已进入全场项目列表。</span></section> : null}
      <section className="event-stats"><div><strong>{projects.length}</strong><span>已公开项目</span></div><div><strong>08.16 4:00 PM</strong><span>Demo 冻结 / 路演评审</span></div><div><strong>01</strong><span>观众最喜爱作品</span></div></section>
      <EventSection index="LIVE / PROJECTS" badge="项目列表" title="项目列表" description="项目内容会随团队提交或更新后显示。">
        {loading ? <p className="event-empty">正在读取项目列表…</p> : null}
        {error ? <p className="event-message">{error}</p> : null}
        {!loading && !error && projects.length === 0 ? <p className="event-empty">项目提交尚未开放，或暂时还没有公开作品。</p> : null}
        <div className="project-grid">
          {projects.map((project) => <ProjectCard project={project} key={project.id} />)}
        </div>
      </EventSection>
      <div className="event-actions"><a className="btn inline-link" href="/submit">提交项目材料</a><a className="btn primary inline-link" href="/vote">观众打分入口</a></div>
    </EventShell>
  );
}

function ProjectCard({ project, selectable, selected, onSelect }: { project: Project; selectable?: boolean; selected?: boolean; onSelect?: () => void }) {
  const content = <><div className="project-card__number">#{String(project.projectNumber).padStart(2, "0")}</div>{project.posterUrl ? <img src={project.posterUrl} alt={`${project.projectName} 海报`} /> : null}<div className="project-card__body"><h3>{project.projectName}</h3><p className="project-card__team">{project.teamName}</p><p>{project.oneLiner}</p><span>{project.teamMembers.join(" / ")}</span></div></>;
  return selectable ? <button className={`project-card project-choice ${selected ? "is-selected" : ""}`} type="button" onClick={onSelect} aria-pressed={selected}>{content}</button> : <article className="project-card">{content}</article>;
}

export function ProjectAdminPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<Project | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [bulkDownloading, setBulkDownloading] = useState<"materials" | "posters" | null>(null);

  const load = async (search = query) => {
    setLoading(true);
    setMessage("");
    try {
      const data = await request<{ items: Project[] }>(`/api/admin/projects?q=${encodeURIComponent(search.trim())}`);
      setProjects(data.items);
      setSelected((current) => current ? data.items.find((project) => project.id === current.id) || null : null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "无法加载项目提交");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(""); }, []);

  const deleteProject = async (project: Project) => {
    if (!window.confirm(`确定删除“${project.projectName}”吗？这会同时删除其投票记录和已上传材料，无法恢复。`)) return;
    setLoading(true);
    setMessage("");
    try {
      await request(`/api/admin/projects/${project.id}`, { method: "DELETE" });
      setProjects((current) => current.filter((item) => item.id !== project.id));
      setSelected(null);
      setMessage(`已删除项目“${project.projectName}”。`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除项目失败");
    } finally {
      setLoading(false);
    }
  };

  const downloadAllArchives = async (group: "materials" | "posters") => {
    setBulkDownloading(group);
    setMessage("");
    try {
      const response = await fetch(`${apiBase}/api/admin/projects/archives?group=${group}`, { credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "批量压缩失败，请稍后重试。");
      }
      const blob = await response.blob();
      if (!blob.size || !response.headers.get("content-type")?.includes("application/zip")) throw new Error("未收到 ZIP 文件，请重新部署后台后再试。");
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = group === "posters" ? "HsHH-已提交海报提交.zip" : "HsHH-已提交路演材料+硬件实物／原型（三视图）.zip";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "批量下载失败");
    } finally {
      setBulkDownloading(null);
    }
  };

  return (
    <div className="admin-page project-admin-page">
      <header className="admin-head">
        {/* <div><div className="lead-kicker">admin.projects()</div><h1>项目提交后台</h1><p className="admin-head__note">两版电子海报截止：8 月 15 日 14:00。A4 版用于笔记本展示，0.8m × 2m 版用于路演展位。</p></div> */}
        {/* <div className="admin-head__actions"><button className="btn inline-link" type="button" onClick={() => void downloadAllArchives("posters")} disabled={bulkDownloading !== null}>{bulkDownloading === "posters" ? "正在打包海报" : "下载已提交两版海报"}</button><button className="btn inline-link" type="button" onClick={() => void downloadAllArchives("materials")} disabled={bulkDownloading !== null}>{bulkDownloading === "materials" ? "正在打包路演材料" : "下载已提交路演材料"}</button><a className="btn inline-link" href="/admin/judging">评委评分统计</a><a className="btn inline-link" href="/admin/events">观众投票后台</a><a className="btn inline-link" href="/admin">报名后台</a></div> */}
      </header>
      <div className="admin-toolbar">
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void load(); }} placeholder="搜索项目名称 / 团队名称" />
        <button className="btn primary" type="button" onClick={() => void load()} disabled={loading}>{loading ? "读取中" : "搜索"}</button>
      </div>
      {message ? <div className="admin-error">{message}</div> : null}
      <p className="admin-count">共 {projects.length} 个项目提交</p>
      {loading ? <p className="admin-loading">正在读取项目提交…</p> : null}
      {!loading && projects.length === 0 ? <p className="admin-loading">暂无项目提交。</p> : null}
      <div className="project-admin-grid">
        {projects.map((project) => (
          <article className={`project-admin-card ${selected?.id === project.id ? "is-selected" : ""}`} key={project.id}>
            <div className="project-admin-card__head"><span>#{String(project.projectNumber).padStart(2, "0")}</span><time>{formatAdminDate(project.updatedAt)}</time></div>
            <h2>{project.projectName}</h2>
            <p>{project.teamName}</p>
            <div className="project-admin-card__meta"><span>{project.teamMembers.length ? `${project.teamMembers.length} 位团队成员` : "待补项目成员"}</span><span>{project.posterPrintConfirmed ? "纸质海报已确认" : "未确认纸质海报"}</span><span>{project.posterUrl && project.posterBoothUrl ? "两版电子海报已提交" : "电子海报未齐"}</span><span>{project.pitchPdfUrl && project.prototypeThreeViewsUrl ? "路演材料已提交" : "路演材料未齐"}</span><span>{project.marketingChannels.length ? "宣发已填写" : "宣发未填写"}</span></div>
            <button className="btn" type="button" onClick={() => setSelected(project)}>查看完整提交</button>
          </article>
        ))}
      </div>
      {selected ? <ProjectSubmissionDetail project={selected} onClose={() => setSelected(null)} onDelete={() => void deleteProject(selected)} deleting={loading} /> : null}
    </div>
  );
}

function ProjectSubmissionDetail({ project, onClose, onDelete, deleting }: { project: Project; onClose: () => void; onDelete: () => void; deleting: boolean }) {
  const [downloading, setDownloading] = useState<"materials" | "posters" | null>(null);
  const [downloadError, setDownloadError] = useState("");

  const downloadArchive = async (group: "materials" | "posters") => {
    setDownloading(group);
    setDownloadError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/projects/${project.id}/archive?group=${group}`, { credentials: "include" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || "压缩包生成失败，请确认文件已提交后重试。");
      }
      const blob = await response.blob();
      if (!blob.size || !response.headers.get("content-type")?.includes("application/zip")) {
        throw new Error("未收到 ZIP 文件，请重新部署后台后再试。");
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${project.projectName}+${project.teamName}+${group === "materials" ? "路演材料+硬件实物／原型（三视图）" : "海报提交"}.zip`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : "下载失败，请稍后重试。");
    } finally {
      setDownloading(null);
    }
  };

  const data: Array<[string, React.ReactNode]> = [
    ["项目名称", project.projectName],
    ["团队名称", project.teamName],
    ["团队成员", project.teamMembers.join(" / ")],
    ["一句话介绍", project.oneLiner],
    ["目标用户", project.targetUsers],
    ["应用场景", project.applicationScenarios],
    ["核心功能", project.coreFeatures],
    ["Demo 操作说明", project.demoInstructions],
    ["提交时间", formatAdminDate(project.updatedAt)],
  ];
  return (
    <div className="preview-drawer open project-submission-drawer" role="presentation" onMouseDown={onClose}>
      <aside className="preview-panel project-submission-panel" role="dialog" aria-modal="true" aria-labelledby="projectSubmissionDetailTitle" onMouseDown={(event) => event.stopPropagation()}>
        <div className="preview-head"><div><div className="lead-kicker">submission.detail()</div><h2 id="projectSubmissionDetailTitle">{project.projectName}</h2></div><div className="project-detail-actions"><button className="btn project-delete" type="button" onClick={onDelete} disabled={deleting}>{deleting ? "删除中" : "删除测试项目"}</button><button className="preview-close" type="button" onClick={onClose}>关闭</button></div></div>
        <div className="project-detail-intro"><strong>{project.teamName}</strong><span>最后更新：{formatAdminDate(project.updatedAt)}</span></div>
        <div className="project-detail-grid">{data.map(([label, value]) => <div key={label}><strong>{label}</strong><p>{value}</p></div>)}</div>
        <section className="project-materials-detail" aria-label="路演材料和硬件实物原型三视图">
          <div className="project-detail-section-head"><strong>路演材料 + 硬件实物/原型(三视图)</strong><button className="btn inline-link" type="button" onClick={() => void downloadArchive("materials")} disabled={downloading !== null}>{downloading === "materials" ? "正在打包" : "下载 ZIP"}</button></div>
          <div className="project-materials-detail__items">
            <div><span>Pitch PPT 原文件</span>{project.pitchSourceUrl ? <a href={project.pitchSourceUrl} download>下载文件</a> : <b>未提交</b>}</div>
            <div><span>Pitch PPT PDF 备份</span>{project.pitchPdfUrl ? <a href={project.pitchPdfUrl} download>下载文件</a> : <b>未提交</b>}</div>
            <div><span>Pitch HTML 文件</span>{project.pitchHtmlUrl ? <a href={project.pitchHtmlUrl} download>下载文件</a> : <b>未提交</b>}</div>
            <div><span>硬件实物 / 原型（三视图）</span>{project.prototypeThreeViewsUrl ? <a href={project.prototypeThreeViewsUrl} download>下载文件</a> : <b>未提交</b>}</div>
          </div>
        </section>
        <section className="project-poster-detail" aria-label="海报提交">
          <div className="project-detail-section-head"><strong>海报提交</strong><button className="btn inline-link" type="button" onClick={() => void downloadArchive("posters")} disabled={downloading !== null}>{downloading === "posters" ? "正在打包" : "下载 ZIP"}</button></div>
          <div className="project-poster-detail__items">
            <div><span>A4 电子版（适配笔记本电脑）</span>{project.posterUrl ? <a href={project.posterUrl} target="_blank" rel="noreferrer">查看文件</a> : <b>未提交</b>}</div>
            <div><span>0.8m × 2m 展位电子版</span>{project.posterBoothUrl ? <a href={project.posterBoothUrl} target="_blank" rel="noreferrer">查看文件</a> : <b>未提交</b>}</div>
          </div>
          <p>纸质海报：{project.posterPrintConfirmed ? "已确认携带 A4 与 0.8m × 2m 两种规格" : "尚未确认"}</p>
        </section>
        <section className="project-poster-detail" aria-label="产品市场宣发">
          <div className="project-detail-section-head"><strong>产品市场宣发</strong></div>
          <div className="project-poster-detail__items">
            <div><span>宣发方式</span>{project.marketingChannels.length ? project.marketingChannels.map((channel) => channel === "tuya" ? "方式一：涂鸦智能小红书宣发" : "方式二：DigiKey 社区宣发").join("、") : <b>未选择</b>}</div>
            {project.tuyaPostUrl ? <div><span>方式一：小红书帖子链接</span>{project.tuyaPostConfirmed ? "已确认可访问" : <b>未确认</b>}<a href={project.tuyaPostUrl} target="_blank" rel="noreferrer">查看</a></div> : null}
            {project.digikeyPostUrl ? <div><span>方式二：DigiKey 帖子链接</span>{project.digikeyPostConfirmed ? "已确认可访问" : <b>未确认</b>}<a href={project.digikeyPostUrl} target="_blank" rel="noreferrer">查看</a></div> : null}
            {project.digikeyMaterials ? <div><span>DigiKey 物料</span>{project.digikeyMaterials}</div> : null}
            {project.demoVideoMarketingUrl ? <div><span>小红书 Demo 视频链接</span>{project.demoVideoPlaybackConfirmed ? "已确认可播放" : <b>未确认</b>}<a href={project.demoVideoMarketingUrl} target="_blank" rel="noreferrer">查看</a></div> : null}
          </div>
        </section>
        {downloadError ? <div className="project-download-error" role="alert">{downloadError}</div> : null}
        {project.vidmuseFeedbackTags.length || project.vidmuseFeedbackNote || project.vidmuseFutureInterest ? <section className="project-vidmuse-detail" aria-label="VIDMUSE 使用小记">
          <strong>VIDMUSE 使用小记</strong>
          {project.vidmuseFeedbackTags.length ? <div className="project-vidmuse-tags">{project.vidmuseFeedbackTags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
          {project.vidmuseFeedbackNote ? <p>{project.vidmuseFeedbackNote}</p> : null}
          {project.vidmuseFutureInterest ? <div className="project-vidmuse-interest"><span>未来使用意愿</span><b>{project.vidmuseFutureInterest}</b></div> : null}
        </section> : null}
        <div className="project-file-links">
          <a className="btn inline-link" href={project.demoUrl} target="_blank" rel="noreferrer">打开 Demo</a>
          <a className="btn inline-link" href={project.demoVideoUrl} target="_blank" rel="noreferrer">打开概念视频</a>
          {project.demoHardwareVideoUrl ? <a className="btn inline-link" href={project.demoHardwareVideoUrl} target="_blank" rel="noreferrer">打开硬件实物视频</a> : null}
        </div>
      </aside>
    </div>
  );
}

function formatAdminDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("zh-CN", { hour12: false });
}

export function VotingPage() {
  const [identity, setIdentity] = useState<VoterIdentity>({ phone: "" });
  const [verified, setVerified] = useState(false);
  const [voting, setVoting] = useState<VotingConfig | null>(null);
  const [candidates, setCandidates] = useState<VotingCandidate[]>([]);
  const [pending, setPending] = useState<VotingCandidate | null>(null);
  const [votedCandidate, setVotedCandidate] = useState<VotingCandidate | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<{ title: string; text: string; toAudience: boolean } | null>(null);

  const loadProjects = async () => {
    const data = await request<{ config: VotingConfig; candidates: VotingCandidate[] }>("/api/voting/projects");
    setVoting(data.config); setCandidates(data.candidates);
  };
  useEffect(() => { void loadProjects().catch((error: Error) => setMessage(error.message)); }, []);
  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setMessage("");
    try {
      const response = await fetch(`${apiBase}/api/vote/identity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: identity.phone }),
      });
      const data = (await response.json().catch(() => ({}))) as { eligible?: boolean; alreadyVoted?: boolean; votedCandidate?: VotingCandidate | null };
      if (response.ok && data.alreadyVoted) {
        setVotedCandidate(data.votedCandidate || null);
        setVerified(true);
        await loadProjects();
        setMessage("你已完成投票，每位观众仅可投票一次。你投给了「" + (data.votedCandidate?.name || "未知作品") + "」。");
        return;
      }
      if (response.ok && data.eligible) { setVerified(true); setVotedCandidate(null); await loadProjects(); return; }
      setNotice({ title: "身份验证未通过", text: "身份验证未通过，请先完成观众报名。", toAudience: true });
    } catch (error) { setNotice({ title: "身份验证未通过", text: "身份验证未通过，请先完成观众报名。", toAudience: true }); } finally { setLoading(false); }
  };
  const vote = async () => {
    if (!pending) return;
    setLoading(true); setMessage("");
    try {
      await request<{ ok: boolean }>("/api/votes", { method: "POST", body: JSON.stringify({ identity, candidateId: pending.id }) });
      setVotedCandidate(pending); setPending(null); setVerified(false); setMessage("投票成功，感谢参与。你投给了「" + pending.name + "」。");
    } catch (error) { setPending(null); setMessage(error instanceof Error ? error.message : "投票失败"); } finally { setLoading(false); }
  };

  return (
    <EventShell kicker="audience.vote()" title="观众最喜爱作品" description="已提交观众报名即可凭报名手机号投票。每位观众仅有一票，提交后不可修改。">
      <EventSection index="01 / VERIFY" title="验证观众身份" description="请输入报名时填写的手机号；系统只用于核验报名与投票资格。">
        <form className="event-form event-identity" onSubmit={verify}>
          <EventField label="报名手机号"><input type="tel" inputMode="numeric" maxLength={11} pattern="^1[3-9]\d{9}$" value={identity.phone} onChange={(event) => setIdentity({ phone: event.target.value.replace(/\D/g, "").slice(0, 11) })} placeholder="13800000000" required /></EventField>
          <div className="event-actions"><button className="btn primary" type="submit" disabled={loading}>{loading ? "验证中" : "验证并进入投票"}</button></div>
        </form>
      </EventSection>
      {message ? <div className="event-message" role="status">{message}</div> : null}
      {verified ? <EventSection index="02 / VOTE" title={votedCandidate ? "我的投票" : "选择妳最喜爱的作品"} description={votedCandidate ? "你已完成投票，每位观众仅有一票，提交后不可修改。你投给了「" + votedCandidate.name + "」。已投票作品以高亮标注。" : "每位观众仅有一票，请从下面的作品中选出一项，确认后不可修改。"}>
        {!voting?.isOpen ? <p className="event-message" role="status">当前投票尚未开启，可先浏览作品；开启后即可投票。</p> : null}
        {candidates.length === 0 ? <p className="event-empty">投票名单准备中，请稍后刷新。</p> : null}
        {candidates.length ? <div className="jury-score-list">
          {[...candidates].sort((a, b) => Number(votedCandidate && b.id === votedCandidate.id) - Number(votedCandidate && a.id === votedCandidate.id)).map((candidate) => (
            <article className={"jury-team-card" + (votedCandidate && votedCandidate.id === candidate.id ? " is-voted" : "")} key={candidate.id}>
              <header className="jury-team-card__head"><div><span>#{String(candidate.number).padStart(2, "0")}</span><h3>{candidate.name}</h3></div>{votedCandidate && votedCandidate.id === candidate.id ? <b className="is-saved">已投</b> : null}</header>
              <footer className="jury-team-card__foot"><div><span>作品编号</span><strong>#{String(candidate.number).padStart(2, "0")} {candidate.name}</strong></div>{!votedCandidate ? <button className="btn primary" type="button" disabled={loading} onClick={() => setPending(candidate)}>投 TA 一票</button> : null}</footer>
            </article>
          ))}
        </div> : null}
      </EventSection> : null}
      <VoteConfirmModal project={pending} loading={loading} onClose={() => setPending(null)} onConfirm={() => void vote()} />
      {notice ? <NoticeModal title={notice.title} message={notice.text} actionLabel={notice.toAudience ? "去报名" : "知道了"} onAction={() => { if (notice.toAudience) { window.location.assign("/audience"); } else { setNotice(null); } }} /> : null}
    </EventShell>
  );
}

function NoticeModal(props: { title: string; message: string; actionLabel: string; onAction: () => void }) {
  return <div className="event-modal" role="presentation"><section className="notice-panel" role="dialog" aria-modal="true" aria-labelledby="noticeTitle"><div className="notice-head"><div className="lead-kicker">audience.vote()</div><h2 id="noticeTitle">{props.title}</h2></div><div className="notice-body"><p className="event-modal-copy">{props.message}</p><div className="notice-actions"><button className="btn primary" type="button" onClick={props.onAction}>{props.actionLabel}</button></div></div></section></div>;
}

function VoteConfirmModal(props: { project: VotingCandidate | null; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!props.project) return null;
  return <div className="event-modal" role="presentation"><section className="notice-panel" role="dialog" aria-modal="true" aria-labelledby="voteConfirmTitle"><div className="notice-head"><div className="lead-kicker">confirm.vote()</div><h2 id="voteConfirmTitle">确认投票</h2></div><div className="notice-body"><p className="event-modal-copy">确认将唯一一票投给 <strong>{props.project.name}</strong> 吗？提交后不可修改。</p><div className="notice-actions"><button className="btn" type="button" onClick={props.onClose} disabled={props.loading}>返回选择</button><button className="btn primary" type="button" onClick={props.onConfirm} disabled={props.loading}>{props.loading ? "提交中" : "确认投票"}</button></div></div></section></div>;
}

type AdminEventData = { config: VotingConfig; stats: { eligibleAudience: number; votedAudience: number; voteRate: number }; candidates: VotingCandidate[] };

export function EventAdminDashboard() {
  const [data, setData] = useState<AdminEventData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const load = async () => { try { setData(await request<AdminEventData>("/api/admin/event-dashboard")); } catch (error) { setMessage(error instanceof Error ? error.message : "无法加载赛事后台"); } };
  useEffect(() => { void load(); }, []);
  const updateConfig = async (isOpen: boolean) => { setLoading(true); try { await request("/api/admin/voting-config", { method: "PUT", body: JSON.stringify({ isOpen }) }); await load(); } catch (error) { setMessage(error instanceof Error ? error.message : "更新失败"); } finally { setLoading(false); } };
  const exportVotes = () => { window.location.assign(`${apiBase}/api/admin/votes/export.csv`); };
  return <div className="admin-page event-admin"><header className="admin-head"><div><div className="lead-kicker">admin.event()</div><h1>观众投票后台</h1></div><div className="admin-head__actions"><a className="btn inline-link" href="/admin/judging">评委评分统计</a><button className="btn primary" type="button" onClick={exportVotes}>导出投票 CSV</button></div></header>{message ? <div className="admin-error">{message}</div> : null}{data ? <><section className="admin-event-stats"><div><strong>{data.stats.eligibleAudience}</strong><span>已报名观众</span></div><div><strong>{data.stats.votedAudience}</strong><span>已投票</span></div><div><strong>{data.stats.voteRate}%</strong><span>投票率</span></div><div><strong>{data.config.isOpen ? "进行中" : "已关闭"}</strong><span>投票状态</span></div></section><div className="admin-toolbar"><button className="btn primary" type="button" disabled={loading || data.config.isOpen} onClick={() => void updateConfig(true)}>开启投票</button><button className="btn" type="button" disabled={loading || !data.config.isOpen} onClick={() => void updateConfig(false)}>关闭投票</button><button className="btn" type="button" onClick={() => void load()}>刷新数据</button></div>      <div className="admin-table-wrap"><table className="admin-table admin-event-table"><thead><tr><th>排名</th><th>编号</th><th>投票项目</th><th>有效票数</th><th>得票率</th></tr></thead><tbody>{[...data.candidates].sort((a, b) => (b.validVotes || 0) - (a.validVotes || 0)).map((candidate, index) => <tr key={candidate.id}><td>#{(candidate.validVotes || 0) > 0 ? index + 1 : "-"}</td><td>#{String(candidate.number).padStart(2, "0")}</td><td>{candidate.name}</td><td><strong>{candidate.validVotes || 0}</strong></td><td>{data.stats.votedAudience ? Math.round(((candidate.validVotes || 0) / data.stats.votedAudience) * 100) + "%" : "-"}</td></tr>)}</tbody></table></div></> : <p className="event-empty">正在读取赛事数据…</p>}</div>;
}

function scoreText(value: number | null | undefined) {
  return value === null || value === undefined ? "-" : Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function JuryScoringPage() {
  const [config, setConfig] = useState<JuryScoringConfig | null>(null);
  const [judgeName, setJudgeName] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});
  const [savedTeams, setSavedTeams] = useState<string[]>([]);
  const [savingTeam, setSavingTeam] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void request<JuryScoringConfig>("/api/judging/config")
      .then((data) => setConfig(data))
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!judgeName || !config) {
      setDrafts({});
      setSavedTeams([]);
      return;
    }
    setLoading(true);
    setMessage("");
    void request<{ scores: JuryScore[] }>(`/api/judging/scores?judge=${encodeURIComponent(judgeName)}`)
      .then((data) => {
        const nextDrafts: Record<string, Record<string, string>> = {};
        data.scores.forEach((score) => {
          nextDrafts[score.teamKey] = Object.fromEntries(config.dimensions.map((dimension) => [dimension.key, String(score.scores[dimension.key] ?? "")]));
        });
        setDrafts(nextDrafts);
        setSavedTeams(data.scores.map((score) => score.teamKey));
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, [judgeName, config]);

  const updateScore = (teamKey: string, dimension: JuryDimension, value: string) => {
    const normalized = value.replace(/[^0-9.]/g, "");
    setDrafts((current) => ({ ...current, [teamKey]: { ...(current[teamKey] || {}), [dimension.key]: normalized } }));
    setSavedTeams((current) => current.filter((key) => key !== teamKey));
  };

  const totalFor = (teamKey: string) => config?.dimensions.reduce((sum, dimension) => sum + (Number(drafts[teamKey]?.[dimension.key]) || 0), 0) || 0;
  const isComplete = (teamKey: string) => Boolean(config?.dimensions.every((dimension) => {
    const text = String(drafts[teamKey]?.[dimension.key] ?? "").trim();
    const value = Number(text);
    return text.length > 0 && Number.isFinite(value) && value >= 0 && value <= dimension.max;
  }));

  const save = async (team: JuryTeam) => {
    if (!config || !judgeName) return;
    if (!isComplete(team.key)) {
      setMessage("请为当前队伍填写全部六项分数，并确认每项未超过上限。");
      return;
    }
    setSavingTeam(team.key);
    setMessage("");
    try {
      const scores = Object.fromEntries(config.dimensions.map((dimension) => [dimension.key, Number(drafts[team.key]?.[dimension.key])]));
      await request<{ score: JuryScore }>("/api/judging/scores", { method: "POST", body: JSON.stringify({ judgeName, teamKey: team.key, scores }) });
      setSavedTeams((current) => Array.from(new Set([...current, team.key])));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "评分保存失败");
    } finally {
      setSavingTeam(null);
    }
  };

  return (
    <EventShell kicker="jury.score()" title="评委评分" description="请选择评委姓名后，为每支队伍按六项维度评分。每项总分合计 100 分，保存后仍可更新。">
      <EventSection index="01 / JUDGE" title="选择评委" description="评分会按姓名保存。请确认选中的是妳自己的名字。">
        <div className="jury-judge-select">
          <EventField label="评委姓名 *">
            <select value={judgeName} onChange={(event) => setJudgeName(event.target.value)}>
              <option value="">请选择</option>
              {config?.judges.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </EventField>
          {judgeName && config ? <div className="jury-progress"><strong>{savedTeams.length} / {config.teams.length}</strong><span>支队伍已保存评分</span></div> : null}
        </div>
      </EventSection>
      {message ? <div className="event-message" role="status">{message}</div> : null}
      {loading && !config ? <p className="event-empty">正在读取评委名单与评分表…</p> : null}
      {config && judgeName ? <EventSection index="02 / SCORE" title="逐组评分" description="每项支持 0.5 分。点击“保存本组评分”后可随时返回修改并再次保存。">
        <div className="jury-score-list">
          {config.teams.map((team) => {
            const complete = isComplete(team.key);
            return <article className="jury-team-card" key={team.key}>
              <header className="jury-team-card__head"><div><span>#{String(team.number).padStart(2, "0")}</span><h3>{team.name}</h3></div><b className={savedTeams.includes(team.key) ? "is-saved" : ""}>{savedTeams.includes(team.key) ? "已保存" : complete ? "待保存" : "待评分"}</b></header>
              <div className="jury-dimension-grid">
                {config.dimensions.map((dimension) => <EventField key={dimension.key} label={`${dimension.label} ${dimension.english} / ${dimension.max}`}><input type="number" min="0" max={dimension.max} step="0.5" inputMode="decimal" value={drafts[team.key]?.[dimension.key] ?? ""} onChange={(event) => updateScore(team.key, dimension, event.target.value)} onBlur={(event) => { const value = Number(event.target.value); if (event.target.value && Number.isFinite(value)) updateScore(team.key, dimension, String(Math.min(dimension.max, Math.max(0, value)))); }} placeholder="0" /></EventField>)}
              </div>
              <footer className="jury-team-card__foot"><div><span>总分</span><strong>{scoreText(totalFor(team.key))} / 100</strong></div><button className={`btn ${complete ? "primary jury-save-ready" : "jury-save-incomplete"}`} type="button" disabled={savingTeam !== null} onClick={() => void save(team)}>{savingTeam === team.key ? "保存中" : savedTeams.includes(team.key) ? "更新本组评分" : "保存本组评分"}</button></footer>
            </article>;
          })}
        </div>
      </EventSection> : null}
    </EventShell>
  );
}

export function JuryAdminDashboard() {
  const [data, setData] = useState<JuryDashboardData | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const load = async () => {
    setLoading(true);
    setMessage("");
    try { setData(await request<JuryDashboardData>("/api/admin/judging/dashboard")); }
    catch (error) { setMessage(error instanceof Error ? error.message : "无法读取评委评分统计"); }
    finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, []);
  const exportCsv = () => { window.location.assign(`${apiBase}/api/admin/judging/export.csv`); };
  const completedJudges = data?.judgeProgress.filter((judge) => judge.completedTeams === judge.totalTeams).length || 0;
  const scoredTeams = data?.teamStats.filter((team) => team.scoreCount > 0).length || 0;

  return <div className="admin-page jury-admin-page">
    <header className="admin-head"><div><div className="lead-kicker">admin.judging()</div><h1>评委评分统计</h1><p className="admin-head__note">共 18 支队伍、6 位评委、6 个评分维度，总分 100 分。</p></div><div className="admin-head__actions"><a className="btn inline-link" href="/judge">进入评委评分页</a><a className="btn inline-link" href="/admin/events">观众投票后台</a><button className="btn primary" type="button" onClick={exportCsv}>导出评分 CSV</button></div></header>
    {message ? <div className="admin-error">{message}</div> : null}
    {data ? <>
      <section className="admin-event-stats jury-admin-stats"><div><strong>{data.scoreCount}</strong><span>已保存评分</span></div><div><strong>{completedJudges} / {data.judges.length}</strong><span>完成全部评分的评委</span></div><div><strong>{scoredTeams} / {data.teams.length}</strong><span>已有评分的队伍</span></div></section>
      <section className="jury-progress-board"><h2>评委完成进度</h2><div>{data.judgeProgress.map((judge) => <article key={judge.name}><strong>{judge.name}</strong><span>{judge.completedTeams} / {judge.totalTeams} 组</span><div><i style={{ width: `${Math.round((judge.completedTeams / judge.totalTeams) * 100)}%` }} /></div></article>)}</div></section>
      <div className="admin-toolbar"><button className="btn" type="button" onClick={() => void load()} disabled={loading}>{loading ? "刷新中" : "刷新数据"}</button></div>
      <div className="admin-table-wrap"><table className="admin-table jury-admin-table"><thead><tr><th>排名</th><th>队伍</th><th>评分数</th><th>平均总分</th>{data.dimensions.map((dimension) => <th key={dimension.key}>{dimension.label}<br />/{dimension.max}</th>)}</tr></thead><tbody>{data.teamStats.map((team, index) => <tr key={team.key}><td>#{team.scoreCount ? index + 1 : "-"}</td><td>{team.name}</td><td>{team.scoreCount} / {data.judges.length}</td><td><strong>{scoreText(team.averageTotal)}</strong></td>{data.dimensions.map((dimension) => <td key={dimension.key}>{scoreText(team.averages[dimension.key])}</td>)}</tr>)}</tbody></table></div>
    </> : loading ? <p className="admin-loading">正在读取评分统计…</p> : null}
  </div>;
}

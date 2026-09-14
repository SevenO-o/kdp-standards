import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Clipboard, FileText, LoaderCircle, LockKeyhole, RotateCcw } from "lucide-react";
import {ThemeToggle} from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ApiError, getContext, normalize, type NormalizeRequest, type NormalizeResult, type ToolContext } from "@/lib/api";

const initialOptions: NormalizeRequest["options"] = { removeEmptyLines: true, trimLines: true, collapseSpaces: true };
const example = "  今日工作记录  \n\n  完成    工具页面设计  \n  核对\t\t发布流程  \n\n  明日计划：开始联调  ";
const format = (number: number) => number.toLocaleString("zh-CN");

function errorMessage(error: unknown) {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.name === "TimeoutError") return "处理超时，请稍后重试";
  return "连接中断，请检查网络后重试";
}

export default function App() {
  const [context, setContext] = useState<ToolContext | null>(null);
  const [contextError, setContextError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [text, setText] = useState("");
  const [options, setOptions] = useState(initialOptions);
  const [result, setResult] = useState<NormalizeResult | null>(null);
  const [processedInput, setProcessedInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const submitLock = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const intranetVisitor = context?.userId === "intranet-visitor";
  const visitorName = intranetVisitor ? "内网访客" : context?.displayName;
  const characters = [...text].length;
  const inputSignature = JSON.stringify({ text, options });
  const stale = result !== null && inputSignature !== processedInput;

  useEffect(() => {
    let active = true;
    getContext().then((value) => {
      if (!active) return;
      setContext(value);
      document.title = `${value.toolName} · KDP`;
    }).catch((failure: unknown) => {
      if (!active) return;
      setContextError(errorMessage(failure));
      setForbidden(failure instanceof ApiError && [401, 403].includes(failure.status));
    });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitLock.current || !context) return;
    if (!text.trim()) { setError("请先粘贴需要整理的文本"); inputRef.current?.focus(); return; }
    if (characters > 100_000) { setError("文本最多支持 100,000 个字符，请减少后重试"); inputRef.current?.focus(); return; }
    submitLock.current = true;
    setBusy(true); setError(""); setCopyStatus("");
    try {
      const value = await normalize({ text, options });
      setResult(value); setProcessedInput(inputSignature);
    } catch (failure) {
      setError(errorMessage(failure));
      if (failure instanceof ApiError && [401, 403].includes(failure.status)) {
        setForbidden(true); setContextError(failure.message); setText(""); setResult(null);
      }
    } finally { submitLock.current = false; setBusy(false); }
  }

  async function copyResult() {
    if (!result || stale) return;
    try { await navigator.clipboard.writeText(result.text); setCopyStatus("已复制到剪贴板"); }
    catch { setCopyStatus("复制失败，请选中整理稿手动复制"); }
  }

  return <div className="app-shell">
    <header className="topbar">
      <div className="topbar-inner">
        <div className="navigation-group">
          {context?.environment === "production"
            ? <a className="portal-link" href={context.portalUrl}><ArrowLeft size={16} aria-hidden="true" />{intranetVisitor ? "工具箱" : "我的工具"}</a>
            : <span className="portal-link muted" title="部署后可返回我的工具"><ArrowLeft size={16} aria-hidden="true" />我的工具</span>}
          <span className="navigation-divider" aria-hidden="true" />
          <span className="brand">KDP</span>
        </div>
        <div className="topbar-actions"><ThemeToggle/><div className="identity" title={visitorName}>
          <span className="identity-dot" aria-hidden="true" />
          <span>{visitorName ?? (contextError ? "身份未验证" : "正在验证身份…")}</span>
        </div></div>
      </div>
    </header>

    <main>
      <div className="page-heading">
        <div className="tool-mark" aria-hidden="true"><FileText size={25} strokeWidth={1.6} /></div>
        <div><div className="eyebrow">个人效率工具</div><h1>{context?.toolName ?? "文本整理"}</h1><p>{context?.description ?? "删除空行并整理文本空白字符"}</p></div>
        <span className="private-note">{intranetVisitor ? "内网可用" : context?.environment === "development" ? "本地开发" : "仅自己可用"}</span>
      </div>

      {contextError ? <section className="access-state" role="alert">
        <LockKeyhole size={28} aria-hidden="true" />
        <h2>{forbidden ? "暂时无法访问这个工具" : "工具连接失败"}</h2>
        <p>{contextError}</p>
        {forbidden ? <Button asChild><a href="/">返回我的工具</a></Button> : <Button onClick={() => window.location.reload()}>重新连接</Button>}
      </section> : <form onSubmit={submit}>
        <div className="workbench" aria-busy={busy}>
          <section className="editor-panel input-panel">
            <div className="panel-heading">
              <div className="panel-title"><span className="step">01</span><label htmlFor="source-text">原稿</label></div>
              <Button type="button" variant="ghost" size="sm" disabled={busy || !context} onClick={() => { setText(example); setError(""); setCopyStatus(""); inputRef.current?.focus(); }}>试用示例</Button>
            </div>
            <Textarea id="source-text" ref={inputRef} className="text-editor" value={text} onChange={(event) => { setText(event.target.value); setError(""); setCopyStatus(""); }} disabled={busy || !context} placeholder={"把需要整理的文本粘贴在这里…\n\n支持中文、英文和多行文本。"} spellCheck={false} aria-describedby={error ? "input-error source-count" : "source-count"} aria-invalid={Boolean(error)} />
            <div className="panel-footer"><span id="source-count" className={characters > 100_000 ? "text-destructive" : ""}>{format(characters)} / 100,000 字符</span><Button type="button" size="sm" variant="ghost" disabled={!text || busy} onClick={() => { setText(""); setError(""); setCopyStatus(""); inputRef.current?.focus(); }}><RotateCcw aria-hidden="true" />清空</Button></div>
          </section>

          <section className="editor-panel result-panel" aria-labelledby="result-title">
            <div className="panel-heading"><div className="panel-title"><span className="step">02</span><h2 id="result-title">整理稿</h2></div><span className={`result-state ${result && !stale ? "ready" : ""}`} role="status">{busy ? "整理中…" : stale ? "输入已更新" : result ? "已整理" : "等待整理"}</span></div>
            {result ? <Textarea className="text-editor result-text" aria-label="整理后的文本" value={result.text} readOnly spellCheck={false} /> : <div className="empty-result"><span className="empty-glyph" aria-hidden="true"><FileText size={32} strokeWidth={1.25} /></span><p>让文字回到整齐的样子</p><span>整理后的文本会显示在这里</span></div>}
            <div className="panel-footer"><span>{result ? `${format(result.outputCharacters)} 字符 · ${format(result.outputLines)} 行` : "保留原文内容与顺序"}</span><Button type="button" variant="outline" size="sm" disabled={!result || stale || busy} onClick={copyResult}>{copyStatus === "已复制到剪贴板" ? <Check aria-hidden="true" /> : <Clipboard aria-hidden="true" />}{copyStatus === "已复制到剪贴板" ? "已复制" : "复制结果"}</Button></div>
          </section>
        </div>

        <div className="action-area">
          <fieldset disabled={busy || !context} className="options"><legend>整理规则</legend>
            {([ ["removeEmptyLines", "删除空行"], ["trimLines", "去除行首尾空白"], ["collapseSpaces", "合并连续空白"] ] as const).map(([key, label]) => <label className="option" key={key}><input type="checkbox" checked={options[key]} onChange={(event) => { setOptions((current) => ({ ...current, [key]: event.target.checked })); setCopyStatus(""); }} /><span>{label}</span></label>)}
          </fieldset>
          <Button type="submit" disabled={busy || !context} className="submit-button">{busy ? <><LoaderCircle className="loading-icon" aria-hidden="true" />正在整理</> : <>整理文本<ArrowRight aria-hidden="true" /></>}</Button>
        </div>
        <div className="feedback-line" aria-live="polite">
          {error ? <p id="input-error" className="text-destructive" role="alert">{error}</p> : stale ? <p>原稿或规则已更新，重新整理后可复制新结果。</p> : copyStatus ? <p>{copyStatus}</p> : result ? <p><Check size={14} aria-hidden="true" />整理完成，移除 {format(result.removedEmptyLines)} 个空行。{result.inputCharacters === result.outputCharacters && result.text === text ? "原文已符合当前规则。" : `字符 ${format(result.inputCharacters)} → ${format(result.outputCharacters)}`}</p> : <p>只处理空白与换行，不改写文字。</p>}
        </div>
      </form>}
      <footer className="page-footer"><span>由 KDP 托管的个人工具</span><span>文本仅用于本次处理，不保存处理记录</span></footer>
    </main>
  </div>;
}

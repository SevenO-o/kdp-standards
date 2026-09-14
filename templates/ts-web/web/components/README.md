# KUNPO 公共前端组件

本模板沿用 shadcn 的源码组件方式，统一使用 `web/theme.css` 的语义令牌。应用在 `ThemeProvider` 内渲染，`ThemeToggle` 切换并保存外观偏好。默认浅色；初始主题在 `web/index.html` 中提前设置，弹出层从文档根继承主题。不要把 provider 限定在局部卡片而漏掉 portal。

`ui/` 放基础组件，`blocks/` 放可组合的文件选择、空状态和下载入口。业务请求、数据状态、上传和处理逻辑留在工具自身；不要求复制固定页面。

| 文件 | 导出与用法 |
| --- | --- |
| `ui/button.tsx` | Button：variant 为 default、outline、ghost、destructive；默认高 40 px，支持 `asChild` 和 React 19 ref |
| `ui/input.tsx` / `textarea.tsx` / `label.tsx` / `checkbox.tsx` | 原生输入语义；调用方提供 id、关联标签、错误及 aria-describedby |
| `ui/select.tsx` | Select、SelectTrigger、SelectValue、SelectContent、SelectItem、SelectGroup、SelectLabel、SelectSeparator；单选、键盘可用 |
| `ui/tabs.tsx` | Tabs、TabsList、TabsTrigger、TabsContent；默认下划线样式；需要保持卸载面板状态时把业务状态提升到上层 |
| `ui/dialog.tsx` | Dialog、DialogTrigger、DialogContent、DialogTitle、DialogDescription、DialogHeader、DialogFooter、DialogClose |
| `ui/alert-dialog.tsx` | AlertDialog、AlertDialogTrigger、AlertDialogContent、AlertDialogTitle、AlertDialogDescription、AlertDialogFooter、AlertDialogCancel、AlertDialogAction；取消默认获焦点 |
| `ui/alert.tsx` / `badge.tsx` | Alert：info/success/warning/error，Badge：neutral/success/warning/error；文字必须说明状态，图标按需 |
| `ui/table.tsx` | Table 及表头、行、单元格、caption；数字列可用 numeric 类；排序分页由业务负责 |
| `blocks/file-picker.tsx` | 受控 FilePicker：files、onFilesChange、maxBytes、extensions，maxFiles 默认 1，支持 disabled；传入具体业务限制 |
| `blocks/empty-state.tsx` | EmptyState：title、description，可选 icon 和 action |
| `blocks/download-button.tsx` | DownloadButton：href、filename，可选 label、disabled、onRequest；没有 href 时禁用 |

## 单选示例

```tsx
<Label htmlFor="rule">重复记录处理</Label>
<Select value={rule} onValueChange={setRule}>
  <SelectTrigger id="rule"><SelectValue placeholder="选择处理方式" /></SelectTrigger>
  <SelectContent>
    <SelectItem value="first">保留第一条</SelectItem>
    <SelectItem value="last">保留最后一条</SelectItem>
  </SelectContent>
</Select>
```

## 文件与下载

```tsx
const [files, setFiles] = useState<File[]>([]);
<FilePicker files={files} onFilesChange={setFiles}
  extensions={[".csv"]} maxBytes={2 * 1024 * 1024} />
<DownloadButton href={resultUrl} filename="处理结果.csv"
  onRequest={() => setMessage("已请求浏览器下载，请查看下载记录。")} />
```

这里的 CSV 和 2 MB 只是调用示例，工具应按自己的契约设定。文件选择只检查扩展名、非空与大小，服务端还需验证真实内容。换文件时由调用方处理旧结果和过期状态。由 Blob 创建的结果 URL 在替换或卸载时释放；跨来源 URL 的下载行为应实际验证。

Dialog 与 AlertDialog 必须同时提供 Title、Description。确认后如果触发按钮消失，调用方应把焦点送到下一处合理操作；取消和普通关闭由基础组件恢复焦点。清空是否需要确认取决于影响，不能每次无损操作都弹窗。

## 来源与扩展

Select、Tabs、Dialog 和 AlertDialog 使用 Radix 交互基础。组件组合与视觉参考 Studio `radix-vega/select-11`、`tabs-11`、`dialog-04`、`dialog-01`；按钮、输入、反馈和表格方向来自 `button-01`、`input-02`、`input-12`、`alert-11`、`table-01`。已进行中文、主题、接口与模板适配，文件组件是 KDP 本地实现。工具作者不需要 Studio API Key 或 MCP。

新增组件优先沿用现有令牌、尺寸和状态约定；说明用途、依赖和验证范围。不要把维护者预览中的 `.local` 路径、模拟状态、测试按钮或私有资源地址带进工具。

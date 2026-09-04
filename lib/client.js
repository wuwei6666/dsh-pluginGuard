// dsh-plugin-guard browser bundle. Hand-written in the dsh module-loader format.
// The whole file is wrapped so a failure here can never crash the host web app.
try {
	const moduleLoader = window.__ModuleLoader__;
	if (moduleLoader && typeof moduleLoader.load === "function") moduleLoader.load({
		id: "dsh-plugin-guard",
		factory: (require) => {
			var module = { exports: {} };
			var exports = module.exports;
			Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
			let react = require("react");
			let react_jsx_runtime = require("react/jsx-runtime");
			//#region \0dsh-css:plugin-guard.module.css.mjs
		const css = ".bF3PhG_section{width:100%;max-width:760px;color:var(--dsw-alias-label-primary);flex-direction:column;gap:12px;display:flex}.bF3PhG_toolbar{align-items:center;gap:8px;display:flex}.bF3PhG_toolbar input{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);min-width:0;height:34px;color:var(--dsw-alias-label-primary);font:inherit;border-radius:8px;flex:1;padding:0 11px;font-size:13px}.bF3PhG_toolbar button,.bF3PhG_actions button,.bF3PhG_installBox button,.bF3PhG_notice button{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font:inherit;cursor:pointer;border-radius:7px;padding:5px 10px;font-size:12px;line-height:18px}.bF3PhG_toolbar button:hover,.bF3PhG_actions button:hover:not(:disabled),.bF3PhG_installBox button:hover:not(:disabled),.bF3PhG_notice button:hover{border-color:var(--dsw-alias-state-business-primary)}.bF3PhG_actions button:disabled,.bF3PhG_installBox button:disabled{opacity:.45;cursor:default}.bF3PhG_meta,.bF3PhG_status,.bF3PhG_guide p,.bF3PhG_notice{color:var(--dsw-alias-label-tertiary);margin:0;font-size:13px;line-height:20px}.bF3PhG_notice{align-items:center;gap:10px;display:flex}.bF3PhG_notice[data-kind=error],.bF3PhG_result[data-ok=false] strong{color:var(--dsw-alias-state-error-primary)}.bF3PhG_pluginList{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.bF3PhG_pluginRow{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:8px;grid-template-columns:minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:10px 12px;display:grid}.bF3PhG_pluginMain{flex-direction:column;gap:3px;min-width:0;display:flex}.bF3PhG_pluginMain strong,.bF3PhG_pluginMain small,.bF3PhG_pluginMain code{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.bF3PhG_pluginMain strong{font-size:13px;font-weight:600;line-height:19px}.bF3PhG_pluginMain small,.bF3PhG_pluginMain code{color:var(--dsw-alias-label-tertiary);font-size:11px;line-height:16px}.bF3PhG_pluginMain em{color:var(--dsw-alias-state-error-primary);overflow-wrap:anywhere;font-size:11px;font-style:normal;line-height:16px}.bF3PhG_tags,.bF3PhG_actions{white-space:nowrap;align-items:center;gap:6px;display:inline-flex}.bF3PhG_tags span{background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-secondary);border-radius:5px;padding:2px 6px;font-size:11px;line-height:16px}.bF3PhG_tags span[data-kind=user-profile],.bF3PhG_tags span[data-kind=enabled]{color:var(--dsw-alias-state-success-primary)}.bF3PhG_tags span[data-kind=failed]{color:var(--dsw-alias-state-error-primary)}.bF3PhG_installBox{align-items:center;gap:10px;display:flex}.bF3PhG_installBox input{display:none}.bF3PhG_env{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:8px;grid-template-columns:120px minmax(0,1fr);gap:7px 10px;margin:0;padding:10px 12px;font-size:12px;line-height:18px;display:grid}.bF3PhG_env div{display:contents}.bF3PhG_env dt{color:var(--dsw-alias-label-tertiary)}.bF3PhG_env dd{overflow-wrap:anywhere;min-width:0;margin:0}.bF3PhG_guide,.bF3PhG_result,.bF3PhG_progressBox{flex-direction:column;gap:8px;display:flex}.bF3PhG_result,.bF3PhG_progressBox{border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-3);border-radius:8px;padding:10px 12px}.bF3PhG_progressBox[data-active=true]{border-color:var(--dsw-alias-state-business-primary)}.bF3PhG_progressBox strong{font-size:13px;line-height:19px}.bF3PhG_progressBox ol{color:var(--dsw-alias-label-secondary);flex-direction:column;gap:4px;margin:0;padding-left:18px;font-size:12px;line-height:18px;display:flex}.bF3PhG_result p{overflow-wrap:anywhere;margin:0;font-size:12px;line-height:18px}.bF3PhG_result textarea{resize:vertical;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);width:100%;min-height:160px;color:var(--dsw-alias-label-primary);font:inherit;border-radius:7px;padding:8px;font-size:12px;line-height:18px}.bF3PhG_result pre,.bF3PhG_progressBox pre{white-space:pre-wrap;max-height:260px;margin:8px 0 0;font-size:11px;line-height:16px;overflow:auto}@media (width<=720px){.bF3PhG_pluginRow{grid-template-columns:minmax(0,1fr);align-items:start}.bF3PhG_actions{flex-wrap:wrap}.bF3PhG_env{grid-template-columns:1fr}}" + ".bF3PhG_notice[data-kind=update]{color:var(--dsw-alias-state-success-primary)}";
			const tagId = "dsh-plugin-guard/plugin-guard.module.css";
			if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
				const tag = document.createElement("style");
				tag.dataset.plugin = "dsh-plugin-guard";
				tag.dataset.pluginCss = tagId;
				tag.textContent = css;
				document.head.appendChild(tag);
			}
			var plugin_guard_module_css_default = {
				"actions": "bF3PhG_actions",
				"meta": "bF3PhG_meta",
				"notice": "bF3PhG_notice",
				"pluginList": "bF3PhG_pluginList",
				"pluginMain": "bF3PhG_pluginMain",
				"pluginRow": "bF3PhG_pluginRow",
				"result": "bF3PhG_result",
				"section": "bF3PhG_section",
				"status": "bF3PhG_status",
				"tags": "bF3PhG_tags",
				"toolbar": "bF3PhG_toolbar"
			};
			//#endregion
			//#region src/protocol.ts
			/** Same-origin route serving plugin guard operations. */
			const PLUGIN_GUARD_ROUTE = "/api/dsh/plugin-guard";
			//#endregion
			//#region src/client/i18n.ts
			/** UI strings follow the dsh language setting (document.documentElement.lang). */
			const STRINGS = {
				en: {
					tabLabel: "Plugin Guard",
					loading: "Loading plugins…",
					loadFailed: "failed to load plugins",
					crashed: "The Plugin Guard tab hit an error. Everything else is unaffected; refresh the page to retry.",
					newVersion: (latest, current) => `New version ${latest} available (current ${current})`,
					updateNow: "Update now",
					updating: "Updating…",
					updatedTo: (latest) => `Updated to ${latest}; restart the dsh web client to finish`,
					updateCheckFailed: "update check failed",
					retry: "Retry",
					searchPlaceholder: "Search by plugin name or entry id",
					refresh: "Refresh",
					scan: "Scan & isolate",
					scanning: "Scanning…",
					scanTitle: "Import-check every user plugin and move damaged ones out of the boot bundles",
					thisGuard: "this guard",
					userPlugin: "user plugin",
					enable: "Enable",
					pause: "Pause",
					uninstall: "Uninstall",
					empty: "No matching plugins.",
					paused: "Paused",
					running: "Running",
					failed: "Failed to start",
					phaseLoading: "Loading",
					pending: "Waiting for dependencies",
					unloading: "Unloading",
					damagedPrefix: "damaged plugin: ",
					msgEnabled: "Enabled",
					msgDisabled: "Paused",
					msgUninstalled: "Uninstalled",
					msgUninstallInstallFailed: "Removed from the manifest, but the dependency install failed",
					msgScanNone: "Scan complete: no damaged plugins found",
					msgScanIsolated: (count) => `Scan complete: isolated ${count} damaged plugin(s)`,
					msgRegistryUnreachable: "Could not reach the npm registry to check for updates",
					msgAlreadyLatest: "Already up to date",
					msgUpdated: (latest) => `Updated to ${latest}; restart the dsh web client to finish`,
					msgUpdateInstallFailed: "New version written to the manifest, but the dependency install failed",
					msgNotProfileInstalled: "This plugin was not installed as a profile dependency; cannot self-update",
					notRunning: "Not running"
				},
				zh: {
					tabLabel: "插件守卫",
					loading: "正在读取插件…",
					loadFailed: "读取插件失败",
					crashed: "插件守卫界面出错了，其它功能不受影响，刷新页面可重试。",
					newVersion: (latest, current) => `发现新版本 ${latest}（当前 ${current}）`,
					updateNow: "立即更新",
					updating: "正在更新…",
					updatedTo: (latest) => `已更新到 ${latest}，重启 dsh web 后生效`,
					updateCheckFailed: "检查更新失败",
					retry: "重试",
					searchPlaceholder: "搜索插件名称或 entry id",
					refresh: "刷新",
					scan: "扫描隔离",
					scanning: "正在扫描…",
					scanTitle: "逐个导入校验用户插件，把损坏的插件移出启动项",
					thisGuard: "守卫自身",
					userPlugin: "用户插件",
					enable: "启用",
					pause: "暂停",
					uninstall: "卸载",
					empty: "没有匹配的插件。",
					paused: "已暂停",
					running: "运行中",
					failed: "启动失败",
					phaseLoading: "加载中",
					pending: "等待依赖",
					unloading: "卸载中",
					damagedPrefix: "插件损坏：",
					msgEnabled: "已启用",
					msgDisabled: "已暂停",
					msgUninstalled: "已卸载",
					msgUninstallInstallFailed: "已从清单移除，但依赖安装失败",
					msgScanNone: "扫描完成：未发现损坏插件",
					msgScanIsolated: (count) => `扫描完成：已隔离 ${count} 个损坏插件`,
					msgRegistryUnreachable: "无法连接 npm registry 检查更新",
					msgAlreadyLatest: "已是最新版本",
					msgUpdated: (latest) => `已更新到 ${latest}，重启 dsh web 后生效`,
					msgUpdateInstallFailed: "新版本已写入清单，但依赖安装失败",
					msgNotProfileInstalled: "当前插件不是通过 profile 依赖安装的，无法自动更新",
					notRunning: "未运行"
				}
			};
			function currentLang() {
				try {
					const raw = typeof document !== "undefined" && document.documentElement.lang || typeof navigator !== "undefined" && navigator.language || "en";
					return String(raw).toLowerCase().startsWith("zh") ? "zh" : "en";
				} catch {
					return "en";
				}
			}
			/** Always read the live dsh language so slot labels re-resolve correctly. */
			function t(key, ...args) {
				const strings = STRINGS[currentLang()] ?? STRINGS.en;
				const value = strings[key] ?? STRINGS.en[key] ?? key;
				return typeof value === "function" ? value(...args) : value;
			}
			/** Re-render the tab when the host language setting changes. */
			function useLang() {
				const [, setTick] = (0, react.useState)(0);
				(0, react.useEffect)(() => {
					if (typeof MutationObserver === "undefined" || typeof document === "undefined") return void 0;
					let lang = currentLang();
					const observer = new MutationObserver(() => {
						const next = currentLang();
						if (next !== lang) {
							lang = next;
							setTick((value) => value + 1);
						}
					});
					observer.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });
					return () => observer.disconnect();
				}, []);
			}
			//#endregion
			//#region src/client/api.ts
			const SELF_NAME = "dsh-plugin-guard";
			async function readSnapshot(route) {
				const response = await fetch(route);
				const body = await response.json();
				if (!response.ok || body.ok !== true || body.snapshot === void 0) throw new Error(body.message ?? t("loadFailed"));
				return body.snapshot;
			}
			async function postAction(route, body) {
				const response = await fetch(route, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(body)
				});
				const result = await response.json();
				if (!response.ok || result.ok !== true) {
					const error = new Error(result.message);
					error.code = result.code;
					throw error;
				}
				return result;
			}
			function useSnapshot(route) {
				const [nonce, setNonce] = (0, react.useState)(0);
				const [state, setState] = (0, react.useState)({ status: "loading" });
				(0, react.useEffect)(() => {
					let active = true;
					setState({ status: "loading" });
					readSnapshot(route).then((snapshot) => {
						if (active) setState({
							status: "ready",
							snapshot
						});
					}, (error) => {
						if (active) setState({
							status: "error",
							message: error instanceof Error ? error.message : String(error)
						});
					});
					return () => {
						active = false;
					};
				}, [route, nonce]);
				return {
					state,
					refresh: () => {
						setNonce((value) => value + 1);
					},
					setState
				};
			}
			/** Map a server result code to localized text, falling back to the raw message. */
			function resultMessage(result) {
				switch (result?.code) {
					case "enabled": return t("msgEnabled");
					case "disabled": return t("msgDisabled");
					case "uninstalled": return t("msgUninstalled");
					case "uninstall-install-failed": return t("msgUninstallInstallFailed");
					case "scan-none": return t("msgScanNone");
					case "scan-isolated": return t("msgScanIsolated", result.count ?? 0);
					case "registry-unreachable": return t("msgRegistryUnreachable");
					case "already-latest": return t("msgAlreadyLatest");
					case "updated": return t("msgUpdated", result.latest ?? "");
					case "update-install-failed": return t("msgUpdateInstallFailed");
					case "not-profile-installed": return t("msgNotProfileInstalled");
					default: return result?.message ?? "";
				}
			}
			/** Localize the damaged-plugin prefix; the reason itself stays as reported. */
			function failureText(failure) {
				if (typeof failure === "string" && failure.startsWith("damaged plugin: ")) return t("damagedPrefix") + failure.slice("damaged plugin: ".length);
				return failure;
			}
			function shortName(moduleName) {
				const pieces = moduleName.split("/");
				return moduleName.startsWith("@") ? pieces.slice(0, 2).join("/") : pieces[pieces.length - 1] ?? moduleName;
			}
			function phaseText(plugin) {
				if (!plugin.enabled) return t("paused");
				if (plugin.phase === "active") return t("running");
				if (plugin.phase === "failed") return t("failed");
				if (plugin.phase === "loading") return t("phaseLoading");
				if (plugin.phase === "pending") return t("pending");
				if (plugin.phase === "unloading") return t("unloading");
				return t("notRunning");
			}
			function ErrorLine({ message, onRetry }) {
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: plugin_guard_module_css_default.notice,
					"data-kind": "error",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: message }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onRetry,
						children: t("retry")
					})]
				});
			}
			/** Last line of defense: a render crash only blanks this tab, never the host page. */
			class GuardErrorBoundary extends react.Component {
				constructor(props) {
					super(props);
					this.state = { crashed: false };
				}
				static getDerivedStateFromError() {
					return { crashed: true };
				}
				componentDidCatch(error) {
					try {
						console.error("[dsh-plugin-guard] tab crashed:", error);
					} catch {}
				}
				render() {
					if (this.state.crashed) return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: plugin_guard_module_css_default.status,
						children: t("crashed")
					});
					return this.props.children;
				}
			}
			//#endregion
			//#region src/client/UpdateBanner.tsx
			/** Banner that checks npm for a newer dsh-plugin-guard and offers one-click update. */
			function UpdateBanner({ route, version, onMessage }) {
				const [update, setUpdate] = (0, react.useState)({ status: "checking" });
				const [updating, setUpdating] = (0, react.useState)(false);
				const check = (0, react.useCallback)(() => {
					let active = true;
					setUpdate({ status: "checking" });
					postAction(route, { action: "check-update" }).then((result) => {
						if (active) setUpdate({ status: "ready", ...result });
					}, (error) => {
						if (active) setUpdate({
							status: "error",
							code: error?.code,
							message: error instanceof Error ? error.message : String(error)
						});
					});
					return () => {
						active = false;
					};
				}, [route]);
				(0, react.useEffect)(() => check(), [check]);
				const doUpdate = async () => {
					setUpdating(true);
					try {
						const result = await postAction(route, { action: "self-update" });
						onMessage(resultMessage(result));
						if (result.updateAvailable) setUpdate({
							status: "done",
							latest: result.latest
						});
						else setUpdate({ status: "ready", ...result });
					} catch (error) {
						onMessage(error instanceof Error ? error.message : String(error));
					} finally {
						setUpdating(false);
					}
				};
				if (update.status === "ready" && update.updateAvailable) return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: plugin_guard_module_css_default.notice,
					"data-kind": "update",
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("newVersion", update.latest, update.current ?? version) }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						disabled: updating,
						onClick: () => void doUpdate(),
						children: updating ? t("updating") : t("updateNow")
					})]
				});
				if (update.status === "done") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: plugin_guard_module_css_default.notice,
					"data-kind": "update",
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("updatedTo", update.latest) })
				});
				if (update.status === "error") return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: plugin_guard_module_css_default.notice,
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: resultMessage(update) || t("updateCheckFailed") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: check,
						children: t("retry")
					})]
				});
				return null;
			}
			//#endregion
			//#region src/client/PluginGuardTab.tsx
			/** List user plugins, isolate damaged ones, and manage enable/disable/uninstall. */
			function PluginGuardTab({ route }) {
				useLang();
				const { state, refresh, setState } = useSnapshot(route);
				const [query, setQuery] = (0, react.useState)("");
				const [busy, setBusy] = (0, react.useState)(null);
				const [message, setMessage] = (0, react.useState)(null);
				const snapshot = state.status === "ready" ? state.snapshot : void 0;
				const plugins = (0, react.useMemo)(() => {
					const normalized = query.trim().toLocaleLowerCase();
					return (snapshot?.plugins ?? []).filter((plugin) => plugin.source === "user-profile" && (normalized === "" || plugin.moduleName.toLocaleLowerCase().includes(normalized) || plugin.entryId.toLocaleLowerCase().includes(normalized)));
				}, [query, snapshot]);
				const operate = async (plugin, action) => {
					setBusy(`${action}:${plugin.entryId}`);
					setMessage(null);
					try {
						const result = await postAction(route, action === "uninstall" ? {
							action,
							moduleName: plugin.moduleName
						} : {
							action,
							id: plugin.entryId
						});
						setMessage(resultMessage(result));
						if (result.snapshot !== void 0) setState({
							status: "ready",
							snapshot: result.snapshot
						});
						else refresh();
					} catch (error) {
						setMessage(error instanceof Error ? error.message : String(error));
					} finally {
						setBusy(null);
					}
				};
				const runScan = async () => {
					setBusy("scan");
					setMessage(null);
					try {
						const result = await postAction(route, { action: "scan" });
						setMessage(resultMessage(result));
						if (result.snapshot !== void 0) setState({
							status: "ready",
							snapshot: result.snapshot
						});
						else refresh();
					} catch (error) {
						setMessage(error instanceof Error ? error.message : String(error));
					} finally {
						setBusy(null);
					}
				};
				if (state.status === "loading") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
					className: plugin_guard_module_css_default.status,
					children: t("loading")
				});
				if (state.status === "error") return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ErrorLine, {
					message: state.message,
					onRetry: refresh
				});
				return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: plugin_guard_module_css_default.section,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)(UpdateBanner, {
							route,
							version: snapshot.self?.version,
							onMessage: setMessage
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: plugin_guard_module_css_default.toolbar,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: query,
									placeholder: t("searchPlaceholder"),
									onChange: (event) => {
										setQuery(event.currentTarget.value);
									}
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: busy !== null,
									onClick: refresh,
									children: t("refresh")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									disabled: busy !== null,
									title: t("scanTitle"),
									onClick: () => void runScan(),
									children: busy === "scan" ? t("scanning") : t("scan")
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
							className: plugin_guard_module_css_default.meta,
							children: ["Profile: ", snapshot.profileDir, " · dsh-plugin-guard v", snapshot.self?.version ?? "?"]
						}),
						message !== null ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: plugin_guard_module_css_default.notice,
							children: message
						}) : null,
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							className: plugin_guard_module_css_default.pluginList,
							children: plugins.map((plugin) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
								className: plugin_guard_module_css_default.pluginRow,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: plugin_guard_module_css_default.pluginMain,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
												title: plugin.moduleName,
												children: shortName(plugin.moduleName)
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("small", { children: plugin.entryId }),
											plugin.dependencySpec !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", { children: plugin.dependencySpec }) : null,
											plugin.failure !== void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("em", { children: failureText(plugin.failure) }) : null
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: plugin_guard_module_css_default.tags,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"data-kind": plugin.source,
												children: plugin.moduleName === SELF_NAME ? t("thisGuard") : t("userPlugin")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
												"data-kind": plugin.phase === "failed" ? "failed" : plugin.enabled ? "enabled" : "disabled",
												children: phaseText(plugin)
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: plugin_guard_module_css_default.actions,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: busy !== null || plugin.enabled,
												onClick: () => void operate(plugin, "enable"),
												children: t("enable")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: busy !== null || !plugin.enabled,
												onClick: () => void operate(plugin, "disable"),
												children: t("pause")
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												disabled: busy !== null || !plugin.removable,
												onClick: () => void operate(plugin, "uninstall"),
												children: t("uninstall")
											})
										]
									})
								]
							}, `${plugin.entryId}:${plugin.moduleName}`))
						}),
						plugins.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: plugin_guard_module_css_default.status,
							children: t("empty")
						}) : null
					]
				});
			}
			function GuardedTab(props) {
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(GuardErrorBoundary, {
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(PluginGuardTab, { ...props })
				});
			}
			//#endregion
			//#region src/client/index.ts
			const inject = ["slots"];
			/** Register the plugin guard tab under the existing Plugins section. */
			function apply(ctx) {
				try {
					const injected = () => ({ route: PLUGIN_GUARD_ROUTE });
					ctx.slots.inject("settings.plugins.tab", function* () {
						yield ctx.slots.register({
							name: "settings.plugins.tab",
							id: "dsh-plugin-guard",
							order: 20,
							label: () => t("tabLabel"),
							inject: injected
						}, GuardedTab);
					});
				} catch (error) {
					try {
						console.error("[dsh-plugin-guard] failed to register settings tab:", error);
					} catch {}
				}
			}
			//#endregion
			exports.apply = apply;
			exports.inject = inject;
			return module.exports;
		}
	});
} catch (error) {
	try {
		console.error("[dsh-plugin-guard] client bundle failed to load:", error);
	} catch {}
}

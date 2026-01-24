(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[turbopack]/browser/dev/hmr-client/hmr-client.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/// <reference path="../../../shared/runtime-types.d.ts" />
/// <reference path="../../runtime/base/dev-globals.d.ts" />
/// <reference path="../../runtime/base/dev-protocol.d.ts" />
/// <reference path="../../runtime/base/dev-extensions.ts" />
__turbopack_context__.s([
    "connect",
    ()=>connect,
    "setHooks",
    ()=>setHooks,
    "subscribeToUpdate",
    ()=>subscribeToUpdate
]);
function connect({ addMessageListener, sendMessage, onUpdateError = console.error }) {
    addMessageListener((msg)=>{
        switch(msg.type){
            case 'turbopack-connected':
                handleSocketConnected(sendMessage);
                break;
            default:
                try {
                    if (Array.isArray(msg.data)) {
                        for(let i = 0; i < msg.data.length; i++){
                            handleSocketMessage(msg.data[i]);
                        }
                    } else {
                        handleSocketMessage(msg.data);
                    }
                    applyAggregatedUpdates();
                } catch (e) {
                    console.warn('[Fast Refresh] performing full reload\n\n' + "Fast Refresh will perform a full reload when you edit a file that's imported by modules outside of the React rendering tree.\n" + 'You might have a file which exports a React component but also exports a value that is imported by a non-React component file.\n' + 'Consider migrating the non-React component export to a separate file and importing it into both files.\n\n' + 'It is also possible the parent component of the component you edited is a class component, which disables Fast Refresh.\n' + 'Fast Refresh requires at least one parent function component in your React tree.');
                    onUpdateError(e);
                    location.reload();
                }
                break;
        }
    });
    const queued = globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS;
    if (queued != null && !Array.isArray(queued)) {
        throw new Error('A separate HMR handler was already registered');
    }
    globalThis.TURBOPACK_CHUNK_UPDATE_LISTENERS = {
        push: ([chunkPath, callback])=>{
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    };
    if (Array.isArray(queued)) {
        for (const [chunkPath, callback] of queued){
            subscribeToChunkUpdate(chunkPath, sendMessage, callback);
        }
    }
}
const updateCallbackSets = new Map();
function sendJSON(sendMessage, message) {
    sendMessage(JSON.stringify(message));
}
function resourceKey(resource) {
    return JSON.stringify({
        path: resource.path,
        headers: resource.headers || null
    });
}
function subscribeToUpdates(sendMessage, resource) {
    sendJSON(sendMessage, {
        type: 'turbopack-subscribe',
        ...resource
    });
    return ()=>{
        sendJSON(sendMessage, {
            type: 'turbopack-unsubscribe',
            ...resource
        });
    };
}
function handleSocketConnected(sendMessage) {
    for (const key of updateCallbackSets.keys()){
        subscribeToUpdates(sendMessage, JSON.parse(key));
    }
}
// we aggregate all pending updates until the issues are resolved
const chunkListsWithPendingUpdates = new Map();
function aggregateUpdates(msg) {
    const key = resourceKey(msg.resource);
    let aggregated = chunkListsWithPendingUpdates.get(key);
    if (aggregated) {
        aggregated.instruction = mergeChunkListUpdates(aggregated.instruction, msg.instruction);
    } else {
        chunkListsWithPendingUpdates.set(key, msg);
    }
}
function applyAggregatedUpdates() {
    if (chunkListsWithPendingUpdates.size === 0) return;
    hooks.beforeRefresh();
    for (const msg of chunkListsWithPendingUpdates.values()){
        triggerUpdate(msg);
    }
    chunkListsWithPendingUpdates.clear();
    finalizeUpdate();
}
function mergeChunkListUpdates(updateA, updateB) {
    let chunks;
    if (updateA.chunks != null) {
        if (updateB.chunks == null) {
            chunks = updateA.chunks;
        } else {
            chunks = mergeChunkListChunks(updateA.chunks, updateB.chunks);
        }
    } else if (updateB.chunks != null) {
        chunks = updateB.chunks;
    }
    let merged;
    if (updateA.merged != null) {
        if (updateB.merged == null) {
            merged = updateA.merged;
        } else {
            // Since `merged` is an array of updates, we need to merge them all into
            // one, consistent update.
            // Since there can only be `EcmascriptMergeUpdates` in the array, there is
            // no need to key on the `type` field.
            let update = updateA.merged[0];
            for(let i = 1; i < updateA.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateA.merged[i]);
            }
            for(let i = 0; i < updateB.merged.length; i++){
                update = mergeChunkListEcmascriptMergedUpdates(update, updateB.merged[i]);
            }
            merged = [
                update
            ];
        }
    } else if (updateB.merged != null) {
        merged = updateB.merged;
    }
    return {
        type: 'ChunkListUpdate',
        chunks,
        merged
    };
}
function mergeChunkListChunks(chunksA, chunksB) {
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    return chunks;
}
function mergeChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted' || updateA.type === 'deleted' && updateB.type === 'added') {
        return undefined;
    }
    if (updateA.type === 'partial') {
        invariant(updateA.instruction, 'Partial updates are unsupported');
    }
    if (updateB.type === 'partial') {
        invariant(updateB.instruction, 'Partial updates are unsupported');
    }
    return undefined;
}
function mergeChunkListEcmascriptMergedUpdates(mergedA, mergedB) {
    const entries = mergeEcmascriptChunkEntries(mergedA.entries, mergedB.entries);
    const chunks = mergeEcmascriptChunksUpdates(mergedA.chunks, mergedB.chunks);
    return {
        type: 'EcmascriptMergedUpdate',
        entries,
        chunks
    };
}
function mergeEcmascriptChunkEntries(entriesA, entriesB) {
    return {
        ...entriesA,
        ...entriesB
    };
}
function mergeEcmascriptChunksUpdates(chunksA, chunksB) {
    if (chunksA == null) {
        return chunksB;
    }
    if (chunksB == null) {
        return chunksA;
    }
    const chunks = {};
    for (const [chunkPath, chunkUpdateA] of Object.entries(chunksA)){
        const chunkUpdateB = chunksB[chunkPath];
        if (chunkUpdateB != null) {
            const mergedUpdate = mergeEcmascriptChunkUpdates(chunkUpdateA, chunkUpdateB);
            if (mergedUpdate != null) {
                chunks[chunkPath] = mergedUpdate;
            }
        } else {
            chunks[chunkPath] = chunkUpdateA;
        }
    }
    for (const [chunkPath, chunkUpdateB] of Object.entries(chunksB)){
        if (chunks[chunkPath] == null) {
            chunks[chunkPath] = chunkUpdateB;
        }
    }
    if (Object.keys(chunks).length === 0) {
        return undefined;
    }
    return chunks;
}
function mergeEcmascriptChunkUpdates(updateA, updateB) {
    if (updateA.type === 'added' && updateB.type === 'deleted') {
        // These two completely cancel each other out.
        return undefined;
    }
    if (updateA.type === 'deleted' && updateB.type === 'added') {
        const added = [];
        const deleted = [];
        const deletedModules = new Set(updateA.modules ?? []);
        const addedModules = new Set(updateB.modules ?? []);
        for (const moduleId of addedModules){
            if (!deletedModules.has(moduleId)) {
                added.push(moduleId);
            }
        }
        for (const moduleId of deletedModules){
            if (!addedModules.has(moduleId)) {
                deleted.push(moduleId);
            }
        }
        if (added.length === 0 && deleted.length === 0) {
            return undefined;
        }
        return {
            type: 'partial',
            added,
            deleted
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'partial') {
        const added = new Set([
            ...updateA.added ?? [],
            ...updateB.added ?? []
        ]);
        const deleted = new Set([
            ...updateA.deleted ?? [],
            ...updateB.deleted ?? []
        ]);
        if (updateB.added != null) {
            for (const moduleId of updateB.added){
                deleted.delete(moduleId);
            }
        }
        if (updateB.deleted != null) {
            for (const moduleId of updateB.deleted){
                added.delete(moduleId);
            }
        }
        return {
            type: 'partial',
            added: [
                ...added
            ],
            deleted: [
                ...deleted
            ]
        };
    }
    if (updateA.type === 'added' && updateB.type === 'partial') {
        const modules = new Set([
            ...updateA.modules ?? [],
            ...updateB.added ?? []
        ]);
        for (const moduleId of updateB.deleted ?? []){
            modules.delete(moduleId);
        }
        return {
            type: 'added',
            modules: [
                ...modules
            ]
        };
    }
    if (updateA.type === 'partial' && updateB.type === 'deleted') {
        // We could eagerly return `updateB` here, but this would potentially be
        // incorrect if `updateA` has added modules.
        const modules = new Set(updateB.modules ?? []);
        if (updateA.added != null) {
            for (const moduleId of updateA.added){
                modules.delete(moduleId);
            }
        }
        return {
            type: 'deleted',
            modules: [
                ...modules
            ]
        };
    }
    // Any other update combination is invalid.
    return undefined;
}
function invariant(_, message) {
    throw new Error(`Invariant: ${message}`);
}
const CRITICAL = [
    'bug',
    'error',
    'fatal'
];
function compareByList(list, a, b) {
    const aI = list.indexOf(a) + 1 || list.length;
    const bI = list.indexOf(b) + 1 || list.length;
    return aI - bI;
}
const chunksWithIssues = new Map();
function emitIssues() {
    const issues = [];
    const deduplicationSet = new Set();
    for (const [_, chunkIssues] of chunksWithIssues){
        for (const chunkIssue of chunkIssues){
            if (deduplicationSet.has(chunkIssue.formatted)) continue;
            issues.push(chunkIssue);
            deduplicationSet.add(chunkIssue.formatted);
        }
    }
    sortIssues(issues);
    hooks.issues(issues);
}
function handleIssues(msg) {
    const key = resourceKey(msg.resource);
    let hasCriticalIssues = false;
    for (const issue of msg.issues){
        if (CRITICAL.includes(issue.severity)) {
            hasCriticalIssues = true;
        }
    }
    if (msg.issues.length > 0) {
        chunksWithIssues.set(key, msg.issues);
    } else if (chunksWithIssues.has(key)) {
        chunksWithIssues.delete(key);
    }
    emitIssues();
    return hasCriticalIssues;
}
const SEVERITY_ORDER = [
    'bug',
    'fatal',
    'error',
    'warning',
    'info',
    'log'
];
const CATEGORY_ORDER = [
    'parse',
    'resolve',
    'code generation',
    'rendering',
    'typescript',
    'other'
];
function sortIssues(issues) {
    issues.sort((a, b)=>{
        const first = compareByList(SEVERITY_ORDER, a.severity, b.severity);
        if (first !== 0) return first;
        return compareByList(CATEGORY_ORDER, a.category, b.category);
    });
}
const hooks = {
    beforeRefresh: ()=>{},
    refresh: ()=>{},
    buildOk: ()=>{},
    issues: (_issues)=>{}
};
function setHooks(newHooks) {
    Object.assign(hooks, newHooks);
}
function handleSocketMessage(msg) {
    sortIssues(msg.issues);
    handleIssues(msg);
    switch(msg.type){
        case 'issues':
            break;
        case 'partial':
            // aggregate updates
            aggregateUpdates(msg);
            break;
        default:
            // run single update
            const runHooks = chunkListsWithPendingUpdates.size === 0;
            if (runHooks) hooks.beforeRefresh();
            triggerUpdate(msg);
            if (runHooks) finalizeUpdate();
            break;
    }
}
function finalizeUpdate() {
    hooks.refresh();
    hooks.buildOk();
    // This is used by the Next.js integration test suite to notify it when HMR
    // updates have been completed.
    // TODO: Only run this in test environments (gate by `process.env.__NEXT_TEST_MODE`)
    if (globalThis.__NEXT_HMR_CB) {
        globalThis.__NEXT_HMR_CB();
        globalThis.__NEXT_HMR_CB = null;
    }
}
function subscribeToChunkUpdate(chunkListPath, sendMessage, callback) {
    return subscribeToUpdate({
        path: chunkListPath
    }, sendMessage, callback);
}
function subscribeToUpdate(resource, sendMessage, callback) {
    const key = resourceKey(resource);
    let callbackSet;
    const existingCallbackSet = updateCallbackSets.get(key);
    if (!existingCallbackSet) {
        callbackSet = {
            callbacks: new Set([
                callback
            ]),
            unsubscribe: subscribeToUpdates(sendMessage, resource)
        };
        updateCallbackSets.set(key, callbackSet);
    } else {
        existingCallbackSet.callbacks.add(callback);
        callbackSet = existingCallbackSet;
    }
    return ()=>{
        callbackSet.callbacks.delete(callback);
        if (callbackSet.callbacks.size === 0) {
            callbackSet.unsubscribe();
            updateCallbackSets.delete(key);
        }
    };
}
function triggerUpdate(msg) {
    const key = resourceKey(msg.resource);
    const callbackSet = updateCallbackSets.get(key);
    if (!callbackSet) {
        return;
    }
    for (const callback of callbackSet.callbacks){
        callback(msg);
    }
    if (msg.type === 'notFound') {
        // This indicates that the resource which we subscribed to either does not exist or
        // has been deleted. In either case, we should clear all update callbacks, so if a
        // new subscription is created for the same resource, it will send a new "subscribe"
        // message to the server.
        // No need to send an "unsubscribe" message to the server, it will have already
        // dropped the update stream before sending the "notFound" message.
        updateCallbackSets.delete(key);
    }
}
}),
"[project]/lib/supabase.ts [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [client] (ecmascript) <locals>");
;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(("TURBOPACK compile-time value", "https://juhiczvivlopukastctz.supabase.co"), ("TURBOPACK compile-time value", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp1aGljenZpdmxvcHVrYXN0Y3R6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NjA2MTAsImV4cCI6MjA4MzIzNjYxMH0.oKTc8hMoF761y_FyQr43l94TCjvr4U2n14NREslmapg"), {
    auth: {
        persistSession: true,
        detectSessionInUrl: true
    }
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/ProfileMenu.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>ProfileMenu
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/link.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
function ProfileMenu({ displayName, userStreak, confirmedPoints, totalSlots, availableSlots, member }) {
    _s();
    const [isOpen, setIsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isEditing, setIsEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [editName, setEditName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(displayName);
    const [editPhone, setEditPhone] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isAdmin, setIsAdmin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [myTickets, setMyTickets] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [errorMessage, setErrorMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [newDisplayName, setNewDisplayName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(displayName || '');
    const [showProfileModal, setShowProfileModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfileMenu.useEffect": ()=>{
            checkAdminStatus();
        }
    }["ProfileMenu.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "ProfileMenu.useEffect": ()=>{
            if (isOpen) {
                loadMyTickets();
            }
        }
    }["ProfileMenu.useEffect"], [
        isOpen
    ]);
    const checkAdminStatus = async ()=>{
        try {
            const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            if (!user) return;
            const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin').single();
            if (data) {
                setIsAdmin(true);
            }
        } catch (err) {
        // User is not admin, that's fine
        }
    };
    const handleSaveName = async ()=>{
        if (!editName.trim()) {
            setErrorMessage('Display name cannot be empty');
            return;
        }
        setLoading(true);
        try {
            const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            if (!user) {
                setErrorMessage('Not authenticated');
                setLoading(false);
                return;
            }
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
                display_name: editName.trim(),
                phone: editPhone || null
            }).eq('id', user.id);
            if (error) {
                setErrorMessage('Failed to update: ' + error.message);
                setLoading(false);
                return;
            }
            setErrorMessage(null);
            setIsEditing(false);
            alert('✅ Profile updated!');
            // Refresh the profile data if needed
            // ✅ RELOAD THE DASHBOARD DATA
            window.location.reload(); // Simple refresh
        // OR if you have a loadDashboard function:
        // await loadDashboard()
        } catch (err) {
            console.error('Error:', err);
            setErrorMessage('Error updating profile');
        } finally{
            setLoading(false);
        }
    };
    const handleLogout = async ()=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
        router.push('/login');
    };
    const loadMyTickets = async ()=>{
        try {
            const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            if (!user) return;
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('event_members').select('ticket_id, ticket_url, event:events(name, start_at)').eq('user_id', user.id).not('ticket_url', 'is', null);
            if (!error && data && data.length > 0) {
                setMyTickets(data);
            } else {
                setMyTickets([]);
            }
        } catch (err) {
            console.error('Error loading tickets:', err);
            setMyTickets([]);
        }
    };
    const updateProfile = async ()=>{
        if (!newDisplayName.trim()) {
            setErrorMessage('Display name cannot be empty');
            return;
        }
        try {
            const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            if (!user) {
                setErrorMessage('Not authenticated');
                return;
            }
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').update({
                display_name: newDisplayName.trim()
            }).eq('id', user.id);
            if (error) {
                setErrorMessage('Failed: ' + error.message);
                return;
            }
            setShowProfileModal(false);
            alert('✅ Profile updated!');
        // Reload profile data if needed
        } catch (err) {
            setErrorMessage('Error updating profile');
        }
    };
    const userInitial = displayName?.charAt(0).toUpperCase() || 'U';
    const formatDate = (dateString)=>{
        return new Date(dateString).toLocaleDateString('en-ZA', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            position: 'relative'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                "aria-label": "Profile Menu",
                onClick: ()=>setIsOpen(!isOpen),
                style: {
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '18px',
                    fontWeight: 700,
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 12px rgba(255, 117, 31, 0.3)'
                },
                onMouseEnter: (e)=>e.currentTarget.style.transform = 'scale(1.08)',
                onMouseLeave: (e)=>e.currentTarget.style.transform = 'scale(1)',
                children: userInitial
            }, void 0, false, {
                fileName: "[project]/components/ProfileMenu.tsx",
                lineNumber: 210,
                columnNumber: 7
            }, this),
            isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: {
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'white',
                    border: '1px solid #E5E7EB',
                    borderRadius: '16px',
                    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.12)',
                    marginTop: '12px',
                    minWidth: '380px',
                    zIndex: 1000,
                    overflow: 'hidden'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '20px',
                            borderBottom: '1px solid #E5E7EB',
                            background: 'linear-gradient(135deg, #FFF5ED 0%, #FFFFFF 100%)'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    marginBottom: '12px'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            fontSize: '20px',
                                            fontWeight: 700,
                                            boxShadow: '0 4px 12px rgba(255, 117, 31, 0.3)'
                                        },
                                        children: userInitial
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProfileMenu.tsx",
                                        lineNumber: 269,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            flex: 1
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    margin: 0,
                                                    fontSize: '14px',
                                                    color: '#6B7280',
                                                    fontWeight: 500
                                                },
                                                children: "Account"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProfileMenu.tsx",
                                                lineNumber: 287,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    margin: '4px 0 0 0',
                                                    fontWeight: 700,
                                                    fontSize: '16px',
                                                    color: '#1F2937'
                                                },
                                                children: displayName
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProfileMenu.tsx",
                                                lineNumber: 290,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProfileMenu.tsx",
                                        lineNumber: 286,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProfileMenu.tsx",
                                lineNumber: 261,
                                columnNumber: 13
                            }, this),
                            userStreak?.tier && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    background: `${userStreak.tier.color}15`,
                                    border: `1px solid ${userStreak.tier.color}30`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '12px'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: '16px'
                                        },
                                        children: userStreak.tier.emoji
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProfileMenu.tsx",
                                        lineNumber: 310,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            flex: 1
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    margin: 0,
                                                    fontSize: '12px',
                                                    fontWeight: 700,
                                                    color: '#1F2937'
                                                },
                                                children: userStreak.tier.name
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProfileMenu.tsx",
                                                lineNumber: 312,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    margin: '2px 0 0 0',
                                                    fontSize: '11px',
                                                    color: '#6B7280',
                                                    fontWeight: 500
                                                },
                                                children: [
                                                    userStreak.currentMonth,
                                                    " month",
                                                    userStreak.currentMonth !== 1 ? 's' : '',
                                                    " 🔥"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/ProfileMenu.tsx",
                                                lineNumber: 315,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProfileMenu.tsx",
                                        lineNumber: 311,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProfileMenu.tsx",
                                lineNumber: 298,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: '12px 16px',
                                    background: '#F9FAFB',
                                    borderRadius: '10px',
                                    border: '1px solid #E5E7EB',
                                    marginTop: '12px',
                                    marginBottom: '12px'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            margin: '0 0 6px 0',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: '#6B7280',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        },
                                        children: "Your Referral Code"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProfileMenu.tsx",
                                        lineNumber: 333,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: '14px',
                                                    fontWeight: 700,
                                                    color: '#FF751F',
                                                    fontFamily: 'monospace',
                                                    letterSpacing: '2px'
                                                },
                                                children: member?.referral_code || 'N/A'
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProfileMenu.tsx",
                                                lineNumber: 346,
                                                columnNumber: 17
                                            }, this),
                                            member?.referral_code && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    navigator.clipboard.writeText(member.referral_code);
                                                    alert('✅ Referral code copied!');
                                                },
                                                style: {
                                                    padding: '4px 8px',
                                                    background: '#FFF5ED',
                                                    border: '1px solid #FFE4CC',
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    fontSize: '11px',
                                                    fontWeight: 600,
                                                    color: '#FF751F',
                                                    transition: 'all 0.2s ease'
                                                },
                                                onMouseEnter: (e)=>{
                                                    e.currentTarget.style.background = '#FF751F';
                                                    e.currentTarget.style.color = 'white';
                                                },
                                                onMouseLeave: (e)=>{
                                                    e.currentTarget.style.background = '#FFF5ED';
                                                    e.currentTarget.style.color = '#FF751F';
                                                },
                                                children: "📋 Copy"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProfileMenu.tsx",
                                                lineNumber: 358,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProfileMenu.tsx",
                                        lineNumber: 345,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProfileMenu.tsx",
                                lineNumber: 323,
                                columnNumber: 13
                            }, this),
                            member?.rank && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    marginBottom: 0
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        style: {
                                            fontSize: '14px'
                                        },
                                        children: "👑"
                                    }, void 0, false, {
                                        fileName: "[project]/components/ProfileMenu.tsx",
                                        lineNumber: 403,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        style: {
                                            margin: 0,
                                            fontSize: '12px',
                                            fontWeight: 600
                                        },
                                        children: [
                                            "Rank #",
                                            member.rank
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/components/ProfileMenu.tsx",
                                        lineNumber: 404,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/components/ProfileMenu.tsx",
                                lineNumber: 391,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProfileMenu.tsx",
                        lineNumber: 253,
                        columnNumber: 11
                    }, this),
                    (confirmedPoints !== undefined || totalSlots !== undefined || userStreak?.currentMonth) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '16px',
                            borderBottom: '1px solid #E5E7EB'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px'
                            },
                            children: [
                                confirmedPoints !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: '12px',
                                        background: '#F9FAFB',
                                        borderRadius: '10px',
                                        textAlign: 'center',
                                        border: '1px solid #E5E7EB'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                margin: '0 0 4px 0',
                                                fontSize: '11px',
                                                color: '#6B7280',
                                                fontWeight: 600
                                            },
                                            children: "Balance"
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProfileMenu.tsx",
                                            lineNumber: 425,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                margin: 0,
                                                fontSize: '16px',
                                                fontWeight: 700,
                                                color: '#FF751F'
                                            },
                                            children: confirmedPoints.toLocaleString()
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProfileMenu.tsx",
                                            lineNumber: 428,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/ProfileMenu.tsx",
                                    lineNumber: 416,
                                    columnNumber: 19
                                }, this),
                                totalSlots !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        padding: '12px',
                                        background: '#F9FAFB',
                                        borderRadius: '10px',
                                        textAlign: 'center',
                                        border: '1px solid #E5E7EB'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                margin: '0 0 4px 0',
                                                fontSize: '11px',
                                                color: '#6B7280',
                                                fontWeight: 600
                                            },
                                            children: "Spots"
                                        }, void 0, false, {
                                            fileName: "[project]/components/ProfileMenu.tsx",
                                            lineNumber: 443,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            style: {
                                                margin: 0,
                                                fontSize: '16px',
                                                fontWeight: 700,
                                                color: '#FF751F'
                                            },
                                            children: [
                                                availableSlots,
                                                "/",
                                                totalSlots
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/components/ProfileMenu.tsx",
                                            lineNumber: 446,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/ProfileMenu.tsx",
                                    lineNumber: 434,
                                    columnNumber: 19
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProfileMenu.tsx",
                            lineNumber: 414,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ProfileMenu.tsx",
                        lineNumber: 413,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '8px'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setIsEditing(true),
                                style: {
                                    display: 'block',
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#1F2937',
                                    fontWeight: 500,
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease'
                                },
                                onMouseEnter: (e)=>{
                                    e.currentTarget.style.background = '#FFF5ED';
                                    e.currentTarget.style.color = '#FF751F';
                                },
                                onMouseLeave: (e)=>{
                                    e.currentTarget.style.background = 'none';
                                    e.currentTarget.style.color = '#1F2937';
                                },
                                children: "✏️ Update Your Profile"
                            }, void 0, false, {
                                fileName: "[project]/components/ProfileMenu.tsx",
                                lineNumber: 458,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/payments",
                                style: {
                                    textDecoration: 'none'
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setIsOpen(false),
                                    style: {
                                        display: 'block',
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'none',
                                        border: 'none',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        color: '#1F2937',
                                        fontWeight: 500,
                                        borderRadius: '8px',
                                        transition: 'all 0.2s ease'
                                    },
                                    onMouseEnter: (e)=>{
                                        e.currentTarget.style.background = '#FFF5ED';
                                        e.currentTarget.style.color = '#FF751F';
                                    },
                                    onMouseLeave: (e)=>{
                                        e.currentTarget.style.background = 'none';
                                        e.currentTarget.style.color = '#1F2937';
                                    },
                                    children: "💳 Your Transactions"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProfileMenu.tsx",
                                    lineNumber: 488,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/components/ProfileMenu.tsx",
                                lineNumber: 487,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProfileMenu.tsx",
                        lineNumber: 456,
                        columnNumber: 11
                    }, this),
                    myTickets.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            padding: '12px 16px',
                            borderTop: '1px solid #E5E7EB',
                            borderBottom: '1px solid #E5E7EB'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                style: {
                                    margin: '0 0 12px 0',
                                    fontSize: '12px',
                                    fontWeight: 700,
                                    color: '#6B7280',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                },
                                children: "🎫 My Groove Tickets"
                            }, void 0, false, {
                                fileName: "[project]/components/ProfileMenu.tsx",
                                lineNumber: 521,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                },
                                children: myTickets.map((ticket)=>{
                                    const eventDate = ticket.event?.start_at ? new Date(ticket.event.start_at) : null;
                                    const daysUntil = eventDate ? Math.max(0, Math.ceil((eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            padding: '12px',
                                            background: '#F9FAFB',
                                            borderRadius: '10px',
                                            border: '1px solid #E5E7EB',
                                            transition: 'all 0.2s ease'
                                        },
                                        onMouseEnter: (e)=>{
                                            e.currentTarget.style.background = '#FFFFFF';
                                            e.currentTarget.style.borderColor = '#FF751F';
                                        },
                                        onMouseLeave: (e)=>{
                                            e.currentTarget.style.background = '#F9FAFB';
                                            e.currentTarget.style.borderColor = '#E5E7EB';
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    margin: '0 0 4px 0',
                                                    fontWeight: 600,
                                                    color: '#1F2937',
                                                    fontSize: '13px'
                                                },
                                                children: ticket.event?.name
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProfileMenu.tsx",
                                                lineNumber: 562,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                style: {
                                                    margin: '0 0 8px 0',
                                                    color: '#6B7280',
                                                    fontSize: '12px'
                                                },
                                                children: [
                                                    eventDate ? formatDate(eventDate.toISOString()) : 'Date TBA',
                                                    daysUntil !== null && daysUntil > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        style: {
                                                            color: '#FF751F',
                                                            fontWeight: 600,
                                                            marginLeft: '4px'
                                                        },
                                                        children: [
                                                            "• ",
                                                            daysUntil,
                                                            "d away"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/components/ProfileMenu.tsx",
                                                        lineNumber: 568,
                                                        columnNumber: 27
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/components/ProfileMenu.tsx",
                                                lineNumber: 565,
                                                columnNumber: 23
                                            }, this),
                                            ticket.ticket_url && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                href: ticket.ticket_url,
                                                target: "_blank",
                                                rel: "noopener noreferrer",
                                                style: {
                                                    display: 'inline-block',
                                                    color: '#FF751F',
                                                    textDecoration: 'none',
                                                    fontWeight: 600,
                                                    fontSize: '12px',
                                                    padding: '6px 12px',
                                                    borderRadius: '6px',
                                                    background: '#FFF5ED',
                                                    transition: 'all 0.2s ease',
                                                    border: '1px solid #FFE4CC'
                                                },
                                                onMouseEnter: (e)=>{
                                                    e.currentTarget.style.background = 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)';
                                                    e.currentTarget.style.color = 'white';
                                                    e.currentTarget.style.borderColor = '#FF751F';
                                                },
                                                onMouseLeave: (e)=>{
                                                    e.currentTarget.style.background = '#FFF5ED';
                                                    e.currentTarget.style.color = '#FF751F';
                                                    e.currentTarget.style.borderColor = '#FFE4CC';
                                                },
                                                children: "⬇️ Download PDF"
                                            }, void 0, false, {
                                                fileName: "[project]/components/ProfileMenu.tsx",
                                                lineNumber: 574,
                                                columnNumber: 25
                                            }, this)
                                        ]
                                    }, ticket.ticket_id, true, {
                                        fileName: "[project]/components/ProfileMenu.tsx",
                                        lineNumber: 544,
                                        columnNumber: 21
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/components/ProfileMenu.tsx",
                                lineNumber: 533,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/components/ProfileMenu.tsx",
                        lineNumber: 520,
                        columnNumber: 13
                    }, this),
                    isAdmin && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            borderTop: '1px solid #E5E7EB',
                            padding: '8px'
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$link$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/admin/payments",
                            style: {
                                textDecoration: 'none'
                            },
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>setIsOpen(false),
                                style: {
                                    display: 'block',
                                    width: '100%',
                                    padding: '12px 16px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: '#FF751F',
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease'
                                },
                                onMouseEnter: (e)=>{
                                    e.currentTarget.style.background = '#FFF5ED';
                                },
                                onMouseLeave: (e)=>{
                                    e.currentTarget.style.background = 'none';
                                },
                                children: "⚙️ Admin Dashboard"
                            }, void 0, false, {
                                fileName: "[project]/components/ProfileMenu.tsx",
                                lineNumber: 615,
                                columnNumber: 17
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/components/ProfileMenu.tsx",
                            lineNumber: 614,
                            columnNumber: 15
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/ProfileMenu.tsx",
                        lineNumber: 613,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: handleLogout,
                        style: {
                            display: 'block',
                            width: '100%',
                            padding: '12px 16px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontSize: '14px',
                            color: '#EF4444',
                            fontWeight: 600,
                            borderRadius: '8px',
                            marginTop: 0,
                            borderTop: '1px solid #E5E7EB',
                            paddingTop: '12px',
                            transition: 'all 0.2s ease'
                        },
                        onMouseEnter: (e)=>{
                            e.currentTarget.style.background = '#FEE2E2';
                        },
                        onMouseLeave: (e)=>{
                            e.currentTarget.style.background = 'none';
                        },
                        children: "🚪 Logout"
                    }, void 0, false, {
                        fileName: "[project]/components/ProfileMenu.tsx",
                        lineNumber: 645,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/ProfileMenu.tsx",
                lineNumber: 237,
                columnNumber: 9
            }, this),
            isEditing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                onClick: ()=>setIsEditing(false),
                style: {
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    onClick: (e)=>e.stopPropagation(),
                    style: {
                        background: 'white',
                        padding: '32px',
                        borderRadius: '24px',
                        minWidth: '400px',
                        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.15)'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            style: {
                                margin: '0 0 16px 0',
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#1F2937',
                                fontFamily: 'Poppins'
                            },
                            children: "Edit Profile"
                        }, void 0, false, {
                            fileName: "[project]/components/ProfileMenu.tsx",
                            lineNumber: 703,
                            columnNumber: 13
                        }, this),
                        errorMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                padding: '12px',
                                marginBottom: '16px',
                                background: '#FEE2E2',
                                border: '1px solid #FCA5A5',
                                borderRadius: '8px',
                                color: '#DC2626',
                                fontSize: '13px',
                                fontWeight: 500
                            },
                            children: errorMessage
                        }, void 0, false, {
                            fileName: "[project]/components/ProfileMenu.tsx",
                            lineNumber: 717,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            style: {
                                display: 'block',
                                marginBottom: '16px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        margin: '0 0 6px 0',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#6B7280'
                                    },
                                    children: "Display Name"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProfileMenu.tsx",
                                    lineNumber: 735,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "text",
                                    value: editName,
                                    onChange: (e)=>setEditName(e.target.value),
                                    style: {
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        fontFamily: 'Poppins'
                                    },
                                    placeholder: "Your display name"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProfileMenu.tsx",
                                    lineNumber: 738,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProfileMenu.tsx",
                            lineNumber: 734,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                            style: {
                                display: 'block',
                                marginBottom: '24px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        margin: '0 0 6px 0',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: '#6B7280'
                                    },
                                    children: "Phone Number"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProfileMenu.tsx",
                                    lineNumber: 757,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "tel",
                                    value: editPhone,
                                    onChange: (e)=>setEditPhone(e.target.value),
                                    style: {
                                        width: '100%',
                                        padding: '12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '10px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box',
                                        fontFamily: 'Poppins'
                                    },
                                    placeholder: "Your phone number"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProfileMenu.tsx",
                                    lineNumber: 760,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProfileMenu.tsx",
                            lineNumber: 756,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                gap: '8px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setIsEditing(false),
                                    style: {
                                        flex: 1,
                                        padding: '10px 16px',
                                        background: 'white',
                                        color: '#1F2937',
                                        border: '2px solid #E5E7EB',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        fontFamily: 'Poppins',
                                        transition: 'all 0.2s ease'
                                    },
                                    onMouseEnter: (e)=>{
                                        e.currentTarget.style.borderColor = '#FF751F';
                                        e.currentTarget.style.background = '#FFF5ED';
                                    },
                                    onMouseLeave: (e)=>{
                                        e.currentTarget.style.borderColor = '#E5E7EB';
                                        e.currentTarget.style.background = 'white';
                                    },
                                    children: "Cancel"
                                }, void 0, false, {
                                    fileName: "[project]/components/ProfileMenu.tsx",
                                    lineNumber: 778,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: handleSaveName,
                                    disabled: loading,
                                    style: {
                                        flex: 1,
                                        padding: '10px 16px',
                                        background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: loading ? 'not-allowed' : 'pointer',
                                        fontWeight: 600,
                                        fontSize: '13px',
                                        fontFamily: 'Poppins',
                                        opacity: loading ? 0.7 : 1,
                                        transition: 'all 0.2s ease'
                                    },
                                    onMouseEnter: (e)=>!loading && (e.currentTarget.style.transform = 'translateY(-2px)'),
                                    onMouseLeave: (e)=>e.currentTarget.style.transform = 'translateY(0)',
                                    children: loading ? 'Saving...' : 'Save Changes'
                                }, void 0, false, {
                                    fileName: "[project]/components/ProfileMenu.tsx",
                                    lineNumber: 804,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/components/ProfileMenu.tsx",
                            lineNumber: 777,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/components/ProfileMenu.tsx",
                    lineNumber: 693,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/components/ProfileMenu.tsx",
                lineNumber: 678,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/ProfileMenu.tsx",
        lineNumber: 208,
        columnNumber: 5
    }, this);
}
_s(ProfileMenu, "dkpZDtualZ0uGLj6qnf/qquRaSA=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = ProfileMenu;
var _c;
__turbopack_context__.k.register(_c, "ProfileMenu");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/pages/dashboard.tsx [client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Dashboard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/jsx-dev-runtime.js [client] (ecmascript)");
// pages/dashboard.tsx
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react/index.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/router.js [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/supabase.ts [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProfileMenu$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/ProfileMenu.tsx [client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
;
;
;
;
;
function Dashboard() {
    _s();
    const [isAdmin, setIsAdmin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [showAdminPanel, setShowAdminPanel] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const [member, setMember] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [leaderboard, setLeaderboard] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [nextGrooves, setNextGrooves] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [suggested, setSuggested] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [totalSlots, setTotalSlots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [availableSlots, setAvailableSlots] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [expandedEventId, setExpandedEventId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showTopUp, setShowTopUp] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [topUpAmount, setTopUpAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [backfillAmount, setBackfillAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(500);
    const [showProfileModal, setShowProfileModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [newDisplayName, setNewDisplayName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(member?.display_name ?? '');
    const [authReady, setAuthReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [profileError, setProfileError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoadingProfile, setIsLoadingProfile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [confirmedPoints, setConfirmedPoints] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [pendingPoints, setPendingPoints] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [ticketedEvents, setTicketedEvents] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [membersForEvent, setMembersForEvent] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [confirmationModal, setConfirmationModal] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: {
            "Dashboard.useState": ()=>{}
        }["Dashboard.useState"],
        isLoading: false
    });
    const [errorMessage, setErrorMessage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [adminNotifications, setAdminNotifications] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [userStreak, setUserStreak] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        currentMonth: 0,
        totalSpots: 0,
        tier: null,
        lastContributionMonth: new Date().toISOString().slice(0, 7) // YYYY-MM
    });
    const [totalPoolAmount, setTotalPoolAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [totalTicketsPurchased, setTotalTicketsPurchased] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])(0);
    const [dismissedLeaderboardTip, setDismissedLeaderboardTip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useState"])({
        "Dashboard.useState": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                if (!member?.id) return false;
                return localStorage.getItem('dismissedLeaderboardTip') === 'true';
            }
            //TURBOPACK unreachable
            ;
        }
    }["Dashboard.useState"]);
    const isTopMember = member?.rank && member.rank <= 40;
    const updateProfile = async ()=>{
        if (!newDisplayName.trim()) {
            setErrorMessage('Display name cannot be empty');
            return;
        }
        try {
            const res = await fetch('/api/update-profile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    display_name: newDisplayName
                })
            });
            if (!res.ok) {
                setErrorMessage('Failed to update profile');
                return;
            }
            setErrorMessage(null);
            setShowProfileModal(false);
            await loadDashboard();
        } catch (err) {
            console.error(err);
            setErrorMessage('Error updating profile');
        }
    };
    const backfillPayment = async ()=>{
        if (!member?.user_id) return;
        try {
            const res = await fetch('/api/admin/backfill-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target_user_id: member.user_id,
                    amount: backfillAmount
                })
            });
            const data = await res.json();
            if (res.ok) {
                setErrorMessage(null);
                await loadDashboard();
            } else {
                setErrorMessage(data.error || 'Backfill failed');
            }
        } catch (err) {
            console.error(err);
            setErrorMessage('Error processing backfill');
        }
    };
    const membersWith500Plus = leaderboard.filter((m)=>m.effective_points >= 500).length;
    const top40Threshold = Math.ceil(membersWith500Plus * 0.4);
    const isInTop40Badge = member?.effective_points >= 500 && member.rank <= top40Threshold;
    const handleTopUp = async (amount)=>{
        if (!topUpAmount || !member?.user_id) {
            setErrorMessage('Please enter an amount');
            return;
        }
        try {
            const res = await fetch('/api/create-checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    amount: topUpAmount,
                    user_id: member.user_id
                })
            });
            const data = await res.json();
            if (!res.ok) {
                setErrorMessage(data.error || 'Unable to start top-up');
                return;
            }
            localStorage.setItem('pendingCheckoutId', data.checkoutId);
            window.location.href = data.checkoutUrl;
        } catch (err) {
            console.error(err);
            setErrorMessage('Error starting payment');
        }
    };
    {}
    const toggleEvent = (eventId)=>{
        setExpandedEventId((prev)=>prev === eventId ? null : eventId);
    };
    const loadDashboard = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "Dashboard.useCallback[loadDashboard]": async ()=>{
            setLoading(true);
            setErrorMessage(null);
            try {
                const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                const user = session?.user;
                if (!user) {
                    setLoading(false);
                    return;
                }
                const [{ data: profileRow }, { data: memberRow }, { data: leaderboardRows }, { data: joinedRows }, { data: streakData }] = await Promise.all([
                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('id, monthly_slots_used').eq('user_id', user.id).single(),
                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('leaderboard_view').select('*').eq('user_id', user.id).single(),
                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('leaderboard_view').select('*').order('rank', {
                        ascending: true
                    }).limit(10),
                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('event_members').select('event:events(*), ticket_issued, active').eq('user_id', user.id).eq('active', true),
                    __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('current_streak_month, streak_tier, last_contribution_month').eq('id', user.id).single()
                ]);
                const confirmed = memberRow?.effective_points ?? 0;
                setConfirmedPoints(Math.floor(confirmed));
                setPendingPoints(0);
                const activeNext = Array.isArray(joinedRows) ? joinedRows.filter({
                    "Dashboard.useCallback[loadDashboard]": (r)=>r.active === true
                }["Dashboard.useCallback[loadDashboard]"]).map({
                    "Dashboard.useCallback[loadDashboard]": (r)=>r.event
                }["Dashboard.useCallback[loadDashboard]"]) : [];
                const joinedIds = new Set(activeNext.map({
                    "Dashboard.useCallback[loadDashboard]": (e)=>e.id
                }["Dashboard.useCallback[loadDashboard]"]));
                // ADD THIS: Set streak state
                if (streakData) {
                    setUserStreak({
                        currentMonth: streakData.current_streak_month || 0,
                        totalSpots: 0,
                        tier: getTierInfo(streakData.current_streak_month || 0) || null,
                        lastContributionMonth: streakData.last_contribution_month
                    });
                }
                console.log('Streak data loaded:', streakData);
                console.log('dismissedLeaderboardTip:', dismissedLeaderboardTip);
                console.log('localStorage value:', localStorage.getItem('dismissedLeaderboardTip'));
                const { data: openEvents } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('events').select('*, event_members(count)').eq('status', 'open');
                const suggestedEvents = (openEvents ?? []).filter({
                    "Dashboard.useCallback[loadDashboard].suggestedEvents": (e)=>!joinedIds.has(e.id)
                }["Dashboard.useCallback[loadDashboard].suggestedEvents"]);
                const tSlots = Math.floor(confirmed / 500);
                // Calculate actual slots used by summing slot_cost from all active events
                const slotsUsed = activeNext.reduce({
                    "Dashboard.useCallback[loadDashboard].slotsUsed": (sum, event)=>{
                        return sum + (event.slot_cost || 1);
                    }
                }["Dashboard.useCallback[loadDashboard].slotsUsed"], 0);
                const avail = Math.max(0, tSlots - slotsUsed) // ✅ CORRECT
                ;
                setMember({
                    ...memberRow,
                    monthly_slots_used: profileRow?.monthly_slots_used
                });
                setLeaderboard(leaderboardRows ?? []);
                setNextGrooves(activeNext);
                setSuggested(suggestedEvents);
                setTotalSlots(tSlots);
                setAvailableSlots(avail);
            } catch (err) {
                console.error('Error loading dashboard:', err);
                setErrorMessage('Failed to load dashboard. Please refresh.');
            } finally{
                setLoading(false);
            }
            console.log('🔍 Dashboard component rendering');
            console.log('🔍 Supabase client:', __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"]);
        }
    }["Dashboard.useCallback[loadDashboard]"], [
        router
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Dashboard.useEffect": ()=>{
            const checkProfile = {
                "Dashboard.useEffect.checkProfile": async ()=>{
                    try {
                        const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
                        if (!user) {
                            setProfileError('Not authenticated');
                            return;
                        }
                        const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('profiles').select('id').eq('id', user.id).single();
                        if (error || !data) setProfileError("We're setting up your Groove account. Please refresh the page.");
                        else setProfileError(null);
                    } catch (err) {
                        setProfileError('Unable to load profile. Please try again.');
                    } finally{
                        setIsLoadingProfile(false);
                    }
                }
            }["Dashboard.useEffect.checkProfile"];
            checkProfile();
        }
    }["Dashboard.useEffect"], []);
    const getTierInfo = (consecutiveMonths)=>{
        if (consecutiveMonths >= 24) return {
            name: 'Stokvel Legend',
            emoji: '💎',
            color: '#7C3AED',
            description: "You're legendary. 24 months of pure momentum."
        };
        if (consecutiveMonths >= 12) return {
            name: 'Stokvel Guardian',
            emoji: '💎',
            color: '#FF751F',
            description: "You're a force. A year of commitment unlocked."
        };
        if (consecutiveMonths >= 6) return {
            name: 'Stokvel Champion',
            emoji: '🥇',
            color: '#F59E0B',
            description: "You're unstoppable. Your dedication is showing."
        };
        if (consecutiveMonths >= 3) return {
            name: 'Stokvel Builder',
            emoji: '🥈',
            color: '#9CA3AF',
            description: "You're proving consistency matters. Keep the rhythm going."
        };
        if (consecutiveMonths >= 1) return {
            name: 'Stokvel Starter',
            emoji: '🥉',
            color: '#B45309',
            description: "You've started. You're building the foundation."
        };
        return null;
    };
    const checkStreakMilestone = (months)=>{
        if (months === 3) return "🚀 Stokvel Builder unlocked! Your consistency is paying off. Keep pushing.";
        if (months === 6) return "🚀 Stokvel Champion unlocked! You're on fire. Keep the momentum going.";
        if (months === 12) return "🚀 Stokvel Guardian unlocked! A year of pure dedication.";
        if (months === 24) return "🚀 Stokvel Legend unlocked! You're a community pillar.";
        return null;
    };
    // After successful spot unlock:
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Dashboard.useEffect": ()=>{
            console.log('🔍 Component mounted, about to call loadPoolMetrics');
            loadPoolMetrics();
        }
    }["Dashboard.useEffect"], []);
    const loadPoolMetrics = async ()=>{
        try {
            // Calculate total pool
            const { data: paymentData, error: paymentError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('payments').select('amount').eq('status', 'completed');
            console.log('🔍 Payment query result:', {
                paymentData,
                paymentError
            });
            if (!paymentError && paymentData) {
                const total = paymentData.reduce((sum, p)=>sum + p.amount, 0);
                console.log('💰 Total pool amount:', total);
                setTotalPoolAmount(total);
            } else if (paymentError) {
                console.error('❌ Payment query error:', paymentError);
            }
            // Count total tickets issued
            const { data: ticketData, error: ticketError } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].from('event_members').select('id').eq('ticket_issued', true);
            console.log('🔍 Ticket query result:', {
                ticketData,
                ticketError
            });
            if (!ticketError && ticketData) {
                console.log('🎫 Total tickets purchased:', ticketData.length);
                setTotalTicketsPurchased(ticketData.length);
            } else if (ticketError) {
                console.error('❌ Ticket query error:', ticketError);
            }
        } catch (err) {
            console.error('Error loading pool metrics:', err);
        }
    };
    const handleRetry = ()=>{
        setIsLoadingProfile(true);
        setProfileError(null);
        window.location.reload();
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Dashboard.useEffect": ()=>{
            const checkAuth = {
                "Dashboard.useEffect.checkAuth": async ()=>{
                    const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                    const user = session?.user;
                    if (!user) {
                        setErrorMessage('Not authenticated');
                        return;
                    }
                    setAuthReady(true);
                }
            }["Dashboard.useEffect.checkAuth"];
            checkAuth();
        }
    }["Dashboard.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$index$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "Dashboard.useEffect": ()=>{
            if (authReady) loadDashboard();
        }
    }["Dashboard.useEffect"], [
        authReady,
        loadDashboard
    ]);
    const applyAdminPayment = async ()=>{
        if (!member?.user_id) return;
        try {
            await fetch('/api/admin/apply-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    target_user_id: member.user_id,
                    amount: 500
                })
            });
            await loadDashboard();
            setErrorMessage(null);
        } catch (err) {
            console.error(err);
            setErrorMessage('Error applying payment');
        }
    };
    const joinEvent = async (eventId, eventName)=>{
        console.log('🔍 DEBUGGING: Attempting to lock event:', {
            eventId,
            eventName
        });
        setConfirmationModal({
            isOpen: true,
            title: `Lock In ${eventName}?`,
            message: `You're about to lock a spot for this event. You can free it up later if needed.`,
            onConfirm: async ()=>{
                setConfirmationModal((prev)=>({
                        ...prev,
                        isLoading: true
                    }));
                try {
                    if (availableSlots <= 0) {
                        setErrorMessage('No available spots. Add Groove Balance to get more spots.');
                        setConfirmationModal({
                            isOpen: false,
                            title: '',
                            message: '',
                            onConfirm: ()=>{}
                        });
                        return;
                    }
                    const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                    const user = session?.user;
                    if (!user) {
                        setErrorMessage('Not authenticated');
                        return;
                    }
                    console.log('🔍 DEBUGGING: Calling join_event RPC with:', {
                        p_user_id: user.id,
                        p_event_id: eventId
                    });
                    const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].rpc('join_event', {
                        p_user_id: user.id,
                        p_event_id: eventId
                    });
                    console.log('🔍 DEBUGGING: RPC Response:', {
                        data,
                        error
                    });
                    if (error) {
                        console.error('🔍 DEBUGGING: RPC Error:', error);
                        setErrorMessage(error.message || 'Failed to join event');
                    } else {
                        setErrorMessage(`🎉 You're locked in and building your streak!`);
                        await loadDashboard();
                    }
                } catch (err) {
                    console.error('Failed to lock spot:', err);
                    setErrorMessage('Unable to lock spot for event. Please try again.');
                } finally{
                    setConfirmationModal({
                        isOpen: false,
                        title: '',
                        message: '',
                        onConfirm: ()=>{}
                    });
                }
            },
            isLoading: false
        });
    };
    const freeUpSlot = async (eventId, eventName)=>{
        setConfirmationModal({
            isOpen: true,
            title: `Release spot for ${eventName}?`,
            message: `You will lose this spot and the slot will be freed.`,
            onConfirm: async ()=>{
                setConfirmationModal((prev)=>({
                        ...prev,
                        isLoading: true
                    }));
                try {
                    const { data: sessionData } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                    const user = sessionData.session?.user;
                    if (!user) {
                        router.push('/login');
                        return;
                    }
                    const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$supabase$2e$ts__$5b$client$5d$__$28$ecmascript$29$__["supabase"].rpc('free_up_slot', {
                        p_user_id: user.id,
                        p_event_id: eventId
                    });
                    if (error) {
                        setErrorMessage(error.message || 'Failed to release spot');
                    } else {
                        setErrorMessage(null);
                        await loadDashboard();
                    }
                } catch (err) {
                    console.error('Releasing slot crashed:', err);
                    setErrorMessage('Unable to release spot. Please try again.');
                } finally{
                    setConfirmationModal({
                        isOpen: false,
                        title: '',
                        message: '',
                        onConfirm: ()=>{}
                    });
                }
            },
            isLoading: false
        });
    };
    if (loading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 32
        },
        children: "Loading Your Grooves…"
    }, void 0, false, {
        fileName: "[project]/pages/dashboard.tsx",
        lineNumber: 450,
        columnNumber: 23
    }, this);
    if (!member) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            padding: 32
        },
        children: "No member record."
    }, void 0, false, {
        fileName: "[project]/pages/dashboard.tsx",
        lineNumber: 451,
        columnNumber: 23
    }, this);
    const joinedIds = (nextGrooves ?? []).map((e)=>e.id);
    const slotsAfter = Math.floor((confirmedPoints + topUpAmount) / 500);
    const userInitial = member?.display_name?.charAt(0).toUpperCase() || 'U';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: isLoadingProfile ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                flexDirection: 'column',
                gap: '20px'
            },
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                children: "Setting up your Groove profile..."
            }, void 0, false, {
                fileName: "[project]/pages/dashboard.tsx",
                lineNumber: 463,
                columnNumber: 11
            }, this)
        }, void 0, false, {
            fileName: "[project]/pages/dashboard.tsx",
            lineNumber: 462,
            columnNumber: 9
        }, this) : profileError ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
                flexDirection: 'column',
                gap: '20px',
                padding: '20px'
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    style: {
                        color: '#d32f2f',
                        marginBottom: '20px'
                    },
                    children: [
                        "⚠️ ",
                        profileError
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/dashboard.tsx",
                    lineNumber: 467,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    onClick: handleRetry,
                    className: "btn-primary",
                    children: "Retry"
                }, void 0, false, {
                    fileName: "[project]/pages/dashboard.tsx",
                    lineNumber: 468,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/pages/dashboard.tsx",
            lineNumber: 466,
            columnNumber: 9
        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: {
                minHeight: '100vh',
                background: 'linear-gradient(135deg, #F9FAFB 0%, #FFF5ED 100%)',
                overflowX: 'hidden'
            },
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    style: {
                        background: 'white',
                        borderBottom: '1px solid #E5E7EB',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 40
                    },
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: {
                            maxWidth: '1440px',
                            margin: '0 auto',
                            padding: '16px 24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                src: "/images/logo.png",
                                alt: "GrooveFund",
                                width: 120,
                                height: 40,
                                style: {
                                    cursor: 'pointer',
                                    width: 'auto',
                                    height: '32px'
                                },
                                onClick: ()=>router.push('/dashboard')
                            }, void 0, false, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 476,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {}, void 0, false, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 478,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '20px'
                                },
                                children: [
                                    isInTop40Badge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            padding: '8px 16px',
                                            background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                                            borderRadius: '20px',
                                            border: 'none',
                                            color: 'white',
                                            fontSize: '12px',
                                            fontWeight: 600
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "👑"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/dashboard.tsx",
                                                lineNumber: 484,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "TOP 40%"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/dashboard.tsx",
                                                lineNumber: 485,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 483,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 16px',
                                            background: 'white',
                                            borderRadius: '20px',
                                            border: '1px solid #E5E7EB'
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: '18px'
                                                },
                                                children: "⚡"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/dashboard.tsx",
                                                lineNumber: 490,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                style: {
                                                    fontSize: '14px',
                                                    fontWeight: 600,
                                                    color: '#1F2937'
                                                },
                                                children: confirmedPoints
                                            }, void 0, false, {
                                                fileName: "[project]/pages/dashboard.tsx",
                                                lineNumber: 491,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 489,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$ProfileMenu$2e$tsx__$5b$client$5d$__$28$ecmascript$29$__["default"], {
                                        displayName: member?.display_name || 'Profile',
                                        userStreak: userStreak,
                                        confirmedPoints: confirmedPoints,
                                        totalSlots: totalSlots,
                                        availableSlots: availableSlots,
                                        member: member
                                    }, void 0, false, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 493,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 480,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/dashboard.tsx",
                        lineNumber: 474,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/pages/dashboard.tsx",
                    lineNumber: 473,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                    style: {
                        maxWidth: '1440px',
                        margin: '0 auto',
                        padding: '32px 24px',
                        overflowX: 'hidden'
                    },
                    children: [
                        errorMessage && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `alert-box ${errorMessage.includes('successfully') ? 'alert-success' : 'alert-error'}`,
                            style: {
                                marginBottom: '24px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: errorMessage
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 510,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setErrorMessage(null),
                                    style: {
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '18px',
                                        fontWeight: 'bold'
                                    },
                                    children: "✕"
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 511,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 509,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            style: {
                                marginBottom: '48px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                    style: {
                                        fontSize: '48px',
                                        fontWeight: 800,
                                        color: '#1F2937',
                                        margin: '0 0 8px 0'
                                    },
                                    children: [
                                        "Hey ",
                                        member?.display_name?.split(' ')[0] || 'there',
                                        " 👋"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 519,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    style: {
                                        fontSize: '16px',
                                        color: '#6B7280',
                                        margin: 0
                                    },
                                    children: "Save smarter. Groove harder. Together."
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 520,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 518,
                            columnNumber: 13
                        }, this),
                        !dismissedLeaderboardTip && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                padding: '12px 16px',
                                background: '#FFF5ED',
                                borderRadius: '12px',
                                border: '1px solid #FFE4CC',
                                marginBottom: '16px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                gap: '12px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontSize: '12px',
                                        color: '#6B7280',
                                        lineHeight: '1.5',
                                        flex: 1
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            style: {
                                                color: '#FF751F',
                                                display: 'block',
                                                marginBottom: '4px'
                                            },
                                            children: "📊 Welcome To The GrooveFund Community!"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 526,
                                            columnNumber: 17
                                        }, this),
                                        "How it works: Build your Groove Balance by Locking In your Grooves. 1 spot = 500 points. Your place on the Leaderboard is final every 29th, 12pm. Top 40% Groovers are issued tickets at the end of the month. The higher your Groove Balance, the higher you climb. Only Groovers with 1 and more spots qualify for the Top 40%. When we issue a ticket to you = -495 points. The next tickets are then bought at the end of the next month. Dates may change so keep notifications open! Your Groove Streak is separate, it tracks your monthly consistency to unlock special perks - did someone say VIP tickets?! Haha, enough with the boring stuff, your journey starts NOW! Keep Grooving, Keep Climbing! 🚀"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 525,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>{
                                        setDismissedLeaderboardTip(true);
                                        if ("TURBOPACK compile-time truthy", 1) {
                                            localStorage.setItem('dismissedLeaderboardTip', 'true');
                                        }
                                    },
                                    style: {
                                        background: 'none',
                                        border: 'none',
                                        color: '#9CA3AF',
                                        cursor: 'pointer',
                                        fontSize: '16px'
                                    },
                                    children: "✕"
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 532,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 524,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                marginBottom: '48px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "stat-card",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-label",
                                            children: "Groove Balance"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 549,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-value",
                                            children: confirmedPoints
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 550,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: '11px',
                                                color: '#6B7280',
                                                marginTop: '4px'
                                            },
                                            children: "Keep Climbing!"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 551,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 548,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "stat-card",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-label",
                                            children: "Spots Available"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 554,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "stat-value",
                                            children: availableSlots
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 555,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                fontSize: '11px',
                                                color: '#6B7280',
                                                marginTop: '4px'
                                            },
                                            children: [
                                                "/ ",
                                                totalSlots,
                                                " total"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 556,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 553,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 16,
                                        marginTop: 24,
                                        marginBottom: 32
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                background: 'linear-gradient(135deg, #FFF5ED 0%, #FFE8D6 100%)',
                                                padding: 20,
                                                borderRadius: 16,
                                                border: '2px solid #FF751F',
                                                boxShadow: '0 4px 12px rgba(255, 117, 31, 0.1)'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: '#6B7280',
                                                        marginBottom: 12,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 0.5
                                                    },
                                                    children: "🏦 Pool Fund"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 569,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 28,
                                                        fontWeight: 700,
                                                        color: '#FF751F',
                                                        marginBottom: 4
                                                    },
                                                    children: [
                                                        "R",
                                                        (totalPoolAmount * 0.88 || 0).toLocaleString('en-ZA', {
                                                            minimumFractionDigits: 0
                                                        })
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 572,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 12,
                                                        color: '#6B7280',
                                                        fontWeight: 400,
                                                        lineHeight: 1.4
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: "Total pool (after 12% admin fee)"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 576,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                marginTop: 4,
                                                                fontSize: 11,
                                                                color: '#9CA3AF'
                                                            },
                                                            children: "All members' contributions"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 577,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 575,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 562,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                background: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FF 100%)',
                                                padding: 20,
                                                borderRadius: 16,
                                                border: '2px solid #4F46E5',
                                                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.1)'
                                            },
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 14,
                                                        fontWeight: 600,
                                                        color: '#6B7280',
                                                        marginBottom: 12,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 0.5
                                                    },
                                                    children: "🎫 Tickets Secured"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 589,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 28,
                                                        fontWeight: 700,
                                                        color: '#4F46E5',
                                                        marginBottom: 4
                                                    },
                                                    children: totalTicketsPurchased || 0
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 592,
                                                    columnNumber: 17
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    style: {
                                                        fontSize: 12,
                                                        color: '#6B7280',
                                                        fontWeight: 400,
                                                        lineHeight: 1.4
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            children: "Community tickets booked"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 596,
                                                            columnNumber: 19
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                marginTop: 4,
                                                                fontSize: 11,
                                                                color: '#9CA3AF'
                                                            },
                                                            children: "Building together 🎵"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 597,
                                                            columnNumber: 19
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 595,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 582,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 560,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        background: '#F0F9FF',
                                        border: '1px solid #BFDBFE',
                                        borderRadius: 12,
                                        padding: 16,
                                        marginBottom: 24
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        style: {
                                            fontSize: 13,
                                            color: '#1E40AF',
                                            fontWeight: 500,
                                            lineHeight: 1.6
                                        },
                                        children: [
                                            "💡 ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: "Transparency Matters:"
                                            }, void 0, false, {
                                                fileName: "[project]/pages/dashboard.tsx",
                                                lineNumber: 611,
                                                columnNumber: 20
                                            }, this),
                                            " The pool shows what's actually available after our 12% admin fee. More pool = better chances for everyone. Keep contributing to grow the fund!"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 610,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 603,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "stat-card",
                                    style: {
                                        background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)'
                                    },
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setShowTopUp(true),
                                        style: {
                                            width: '100%',
                                            padding: '12px 0',
                                            background: 'white',
                                            color: '#FF751F',
                                            border: 'none',
                                            borderRadius: '12px',
                                            fontSize: '16px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        },
                                        onMouseEnter: (e)=>e.currentTarget.style.transform = 'translateY(-2px)',
                                        onMouseLeave: (e)=>e.currentTarget.style.transform = 'translateY(0)',
                                        children: "⚡ Top Up"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 616,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 615,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 547,
                            columnNumber: 13
                        }, this),
                        userStreak.currentMonth > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                                borderRadius: '20px',
                                padding: '24px',
                                color: '#FFFFFF',
                                textAlign: 'center',
                                marginBottom: '24px',
                                boxShadow: '0 8px 20px rgba(255, 117, 31, 0.3)'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontSize: '48px',
                                        marginBottom: '8px'
                                    },
                                    children: userStreak.tier?.emoji
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 631,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        marginBottom: '4px',
                                        opacity: 0.95
                                    },
                                    children: userStreak.tier?.name
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 634,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontSize: '28px',
                                        fontWeight: 800,
                                        marginBottom: '12px'
                                    },
                                    children: [
                                        userStreak.currentMonth,
                                        " month streak 🔥"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 637,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        fontSize: '12px',
                                        opacity: 0.9,
                                        lineHeight: '1.5'
                                    },
                                    children: userStreak.tier?.description
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 640,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 622,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '24px',
                                marginBottom: '48px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            style: {
                                                fontSize: '28px',
                                                fontWeight: 800,
                                                color: '#1F2937',
                                                margin: '0 0 24px 0',
                                                paddingBottom: '16px',
                                                borderBottom: '3px solid rgba(255, 117, 31, 0.15)',
                                                letterSpacing: '-0.5px'
                                            },
                                            children: "🥳 Your Locked Grooves"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 652,
                                            columnNumber: 16
                                        }, this),
                                        nextGrooves.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "empty-state",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "empty-state-title",
                                                    children: "No Grooves locked yet"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 654,
                                                    columnNumber: 48
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "empty-state-text",
                                                    children: "Lock your spot for a Groove below"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 654,
                                                    columnNumber: 110
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 654,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '16px'
                                            },
                                            children: nextGrooves.map((e)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "event-card",
                                                    style: {
                                                        background: 'white',
                                                        borderRadius: '16px',
                                                        border: '1px solid #E5E7EB',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                                                        transition: 'all 0.3s ease'
                                                    },
                                                    children: [
                                                        e.image_url ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                            src: e.image_url,
                                                            alt: e.name,
                                                            style: {
                                                                width: '100%',
                                                                height: '160px',
                                                                objectFit: 'cover'
                                                            },
                                                            onError: (e)=>{
                                                                e.currentTarget.style.display = 'none';
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 661,
                                                            columnNumber: 25
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                width: '100%',
                                                                height: '160px',
                                                                background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                fontSize: '14px',
                                                                fontWeight: 600
                                                            },
                                                            children: "No Image"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 670,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                padding: '16px'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                    style: {
                                                                        fontSize: '16px',
                                                                        fontWeight: 700,
                                                                        color: '#1F2937',
                                                                        margin: '0 0 12px 0'
                                                                    },
                                                                    children: e.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                    lineNumber: 675,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: 'grid',
                                                                        gridTemplateColumns: '1fr 1fr',
                                                                        gap: '8px',
                                                                        fontSize: '13px',
                                                                        color: '#6B7280',
                                                                        marginBottom: '12px'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                    children: "Date:"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                                    lineNumber: 678,
                                                                                    columnNumber: 34
                                                                                }, this),
                                                                                " ",
                                                                                new Date(e.start_at).toLocaleDateString('en-ZA', {
                                                                                    day: 'numeric',
                                                                                    month: 'short'
                                                                                })
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 678,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                    children: "Time:"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                                    lineNumber: 679,
                                                                                    columnNumber: 34
                                                                                }, this),
                                                                                " ",
                                                                                new Date(e.start_at).toLocaleTimeString([], {
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 679,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            style: {
                                                                                gridColumn: '1 / -1'
                                                                            },
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                    children: "Location:"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                                    lineNumber: 680,
                                                                                    columnNumber: 67
                                                                                }, this),
                                                                                " ",
                                                                                e.city,
                                                                                e.venue ? ` · ${e.venue}` : ''
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 680,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                    lineNumber: 677,
                                                                    columnNumber: 25
                                                                }, this),
                                                                (()=>{
                                                                    const daysUntil = e.start_at ? Math.max(0, Math.ceil((new Date(e.start_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
                                                                    return daysUntil !== null && daysUntil > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontSize: '11px',
                                                                            color: '#FF751F',
                                                                            fontWeight: 700,
                                                                            marginTop: '8px',
                                                                            paddingTop: '8px',
                                                                            borderTop: '1px solid #E5E7EB'
                                                                        },
                                                                        children: [
                                                                            "🔥 ",
                                                                            daysUntil,
                                                                            " ",
                                                                            daysUntil === 1 ? 'day' : 'days',
                                                                            " to go!"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/dashboard.tsx",
                                                                        lineNumber: 686,
                                                                        columnNumber: 33
                                                                    }, this) : null;
                                                                })(),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        marginTop: '12px',
                                                                        paddingTop: '12px',
                                                                        borderTop: '1px solid #E5E7EB'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            style: {
                                                                                fontSize: '11px',
                                                                                color: '#FF751F',
                                                                                fontWeight: 700
                                                                            },
                                                                            children: e.slot_cost && e.slot_cost > 1 ? `uses ${e.slot_cost} spots` : 'uses 1 spot'
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 694,
                                                                            columnNumber: 25
                                                                        }, this),
                                                                        joinedIds.includes(e.id) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            onClick: ()=>freeUpSlot(e.id, e.name),
                                                                            className: "btn-danger",
                                                                            style: {
                                                                                padding: '8px 12px',
                                                                                fontSize: '12px'
                                                                            },
                                                                            children: "Release Spot"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 698,
                                                                            columnNumber: 27
                                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            disabled: availableSlots <= 0,
                                                                            onClick: ()=>joinEvent(e.id, e.name),
                                                                            className: "btn-primary",
                                                                            style: {
                                                                                padding: '8px 16px',
                                                                                fontSize: '12px',
                                                                                opacity: availableSlots <= 0 ? 0.5 : 1,
                                                                                cursor: availableSlots <= 0 ? 'not-allowed' : 'pointer'
                                                                            },
                                                                            children: "Lock Spot"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 702,
                                                                            columnNumber: 27
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                    lineNumber: 693,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 674,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, e.id, true, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 658,
                                                    columnNumber: 21
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 656,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 651,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            style: {
                                                fontSize: '28px',
                                                fontWeight: 800,
                                                color: '#1F2937',
                                                margin: '0 0 24px 0',
                                                paddingBottom: '16px',
                                                borderBottom: '3px solid rgba(255, 117, 31, 0.15)',
                                                letterSpacing: '-0.5px'
                                            },
                                            children: "🎵 Discover Grooves"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 716,
                                            columnNumber: 16
                                        }, this),
                                        suggested.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "empty-state",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "empty-state-title",
                                                    children: "No Grooves available yet."
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 718,
                                                    columnNumber: 48
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "empty-state-text",
                                                    children: "Check back soon for new community Grooves"
                                                }, void 0, false, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 718,
                                                    columnNumber: 114
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 718,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '16px'
                                            },
                                            children: suggested.map((event)=>{
                                                const isExpanded = expandedEventId === event.id;
                                                const isJoined = joinedIds.includes(event.id);
                                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "event-card",
                                                    style: {
                                                        background: 'white',
                                                        borderRadius: '16px',
                                                        border: '1px solid #E5E7EB',
                                                        overflow: 'hidden',
                                                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
                                                        transition: 'all 0.3s ease'
                                                    },
                                                    children: [
                                                        event.image_url ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                            src: event.image_url,
                                                            alt: event.name,
                                                            style: {
                                                                width: '100%',
                                                                height: '160px',
                                                                objectFit: 'cover'
                                                            },
                                                            onError: (e)=>{
                                                                e.currentTarget.style.display = 'none';
                                                            }
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 728,
                                                            columnNumber: 29
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                width: '100%',
                                                                height: '160px',
                                                                background: 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                color: 'white',
                                                                fontSize: '14px',
                                                                fontWeight: 600
                                                            },
                                                            children: "No Image"
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 737,
                                                            columnNumber: 29
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            style: {
                                                                padding: '16px'
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                    style: {
                                                                        fontSize: '16px',
                                                                        fontWeight: 700,
                                                                        color: '#1F2937',
                                                                        margin: '0 0 12px 0'
                                                                    },
                                                                    children: event.name
                                                                }, void 0, false, {
                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                    lineNumber: 743,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: 'grid',
                                                                        gridTemplateColumns: '1fr 1fr',
                                                                        gap: '8px',
                                                                        fontSize: '13px',
                                                                        color: '#6B7280',
                                                                        marginBottom: '12px'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                    children: "Date:"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                                    lineNumber: 746,
                                                                                    columnNumber: 34
                                                                                }, this),
                                                                                " ",
                                                                                new Date(event.start_at).toLocaleDateString('en-ZA', {
                                                                                    day: 'numeric',
                                                                                    month: 'short'
                                                                                })
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 746,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                    children: "Time:"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                                    lineNumber: 747,
                                                                                    columnNumber: 34
                                                                                }, this),
                                                                                " ",
                                                                                new Date(event.start_at).toLocaleTimeString([], {
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 747,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            style: {
                                                                                gridColumn: '1 / -1'
                                                                            },
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                    children: "Location:"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                                    lineNumber: 748,
                                                                                    columnNumber: 67
                                                                                }, this),
                                                                                " ",
                                                                                event.city,
                                                                                event.venue ? ` · ${event.venue}` : ''
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 748,
                                                                            columnNumber: 29
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                    lineNumber: 745,
                                                                    columnNumber: 29
                                                                }, this),
                                                                (()=>{
                                                                    const daysUntil = event.start_at ? Math.max(0, Math.ceil((new Date(event.start_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
                                                                    return daysUntil !== null && daysUntil > 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        style: {
                                                                            fontSize: '11px',
                                                                            color: '#FF751F',
                                                                            fontWeight: 700,
                                                                            marginTop: '8px',
                                                                            paddingTop: '8px',
                                                                            borderTop: '1px solid #E5E7EB'
                                                                        },
                                                                        children: [
                                                                            "🔥 ",
                                                                            daysUntil,
                                                                            " ",
                                                                            daysUntil === 1 ? 'day' : 'days',
                                                                            " to go!"
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/pages/dashboard.tsx",
                                                                        lineNumber: 754,
                                                                        columnNumber: 33
                                                                    }, this) : null;
                                                                })(),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    style: {
                                                                        position: 'absolute',
                                                                        top: '12px',
                                                                        right: '12px',
                                                                        background: '#FF751F',
                                                                        color: 'white',
                                                                        padding: '4px 8px',
                                                                        borderRadius: '12px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 700
                                                                    },
                                                                    children: [
                                                                        "Popular in ",
                                                                        event.city
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                    lineNumber: 761,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    style: {
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        gap: '8px',
                                                                        marginTop: '12px',
                                                                        paddingTop: '12px',
                                                                        borderTop: '1px solid #E5E7EB'
                                                                    },
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            style: {
                                                                                fontSize: '11px',
                                                                                color: '#FF751F',
                                                                                fontWeight: 700
                                                                            },
                                                                            children: event.slot_cost && event.slot_cost > 1 ? `uses ${event.slot_cost} spots` : 'uses 1 spot'
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 763,
                                                                            columnNumber: 29
                                                                        }, this),
                                                                        joinedIds.includes(event.id) ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            onClick: ()=>freeUpSlot(event.id, event.name),
                                                                            className: "btn-danger",
                                                                            style: {
                                                                                padding: '8px 12px',
                                                                                fontSize: '12px'
                                                                            },
                                                                            children: "Release Spot"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 767,
                                                                            columnNumber: 31
                                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            disabled: availableSlots <= 0,
                                                                            onClick: ()=>joinEvent(event.id, event.name),
                                                                            className: "btn-primary",
                                                                            style: {
                                                                                padding: '8px 16px',
                                                                                fontSize: '12px',
                                                                                opacity: availableSlots <= 0 ? 0.5 : 1,
                                                                                cursor: availableSlots <= 0 ? 'not-allowed' : 'pointer'
                                                                            },
                                                                            children: "Lock Spot"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/pages/dashboard.tsx",
                                                                            lineNumber: 771,
                                                                            columnNumber: 31
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/pages/dashboard.tsx",
                                                                    lineNumber: 762,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 741,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, event.id, true, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 725,
                                                    columnNumber: 25
                                                }, this);
                                            })
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 720,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 715,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 647,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                                gap: '24px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            style: {
                                                fontSize: '20px',
                                                fontWeight: 700,
                                                color: '#1F2937',
                                                margin: '0 0 16px 0',
                                                paddingBottom: '12px',
                                                borderBottom: '2px solid rgba(255, 117, 31, 0.1)'
                                            },
                                            children: "🏆 Top Groove Members"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 789,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            style: {
                                                background: 'white',
                                                borderRadius: '16px',
                                                border: '1px solid #E5E7EB',
                                                overflow: 'hidden',
                                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
                                            },
                                            children: leaderboard.slice(0, 5).map((l, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "leaderboard-item",
                                                    style: {
                                                        padding: '12px 16px',
                                                        borderBottom: i < 4 ? '1px solid #E5E7EB' : 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px'
                                                    },
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "leaderboard-rank",
                                                            style: {
                                                                fontSize: '14px',
                                                                fontWeight: 700,
                                                                color: '#FF751F',
                                                                minWidth: '30px'
                                                            },
                                                            children: [
                                                                "#",
                                                                l.rank
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 793,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "leaderboard-name",
                                                            style: {
                                                                flex: 1,
                                                                fontSize: '14px',
                                                                color: '#1F2937',
                                                                fontWeight: 500
                                                            },
                                                            children: l.display_name ?? 'Anon'
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 794,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "leaderboard-points",
                                                            style: {
                                                                fontSize: '13px',
                                                                fontWeight: 600,
                                                                color: '#6B7280'
                                                            },
                                                            children: l.effective_points
                                                        }, void 0, false, {
                                                            fileName: "[project]/pages/dashboard.tsx",
                                                            lineNumber: 795,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, l.user_id, true, {
                                                    fileName: "[project]/pages/dashboard.tsx",
                                                    lineNumber: 792,
                                                    columnNumber: 21
                                                }, this))
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 790,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>router.push('/leaderboard'),
                                            style: {
                                                marginTop: '12px',
                                                color: '#FF751F',
                                                background: 'none',
                                                border: 'none',
                                                fontSize: '13px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                width: '100%',
                                                textAlign: 'center',
                                                transition: 'all 0.2s ease'
                                            },
                                            onMouseEnter: (e)=>e.currentTarget.style.textDecoration = 'underline',
                                            onMouseLeave: (e)=>e.currentTarget.style.textDecoration = 'none',
                                            children: "View Full Leaderboard →"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 799,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 788,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    style: {
                                        background: 'white',
                                        borderRadius: '16px',
                                        border: '1px solid #E5E7EB',
                                        padding: '16px',
                                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)'
                                    },
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            style: {
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                color: '#1F2937',
                                                margin: '0 0 12px 0'
                                            },
                                            children: "⚡ Quick Actions"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 805,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setShowTopUp(true),
                                            className: "btn-primary",
                                            style: {
                                                width: '100%',
                                                marginBottom: '12px',
                                                fontSize: '13px',
                                                padding: '10px',
                                                fontWeight: 600
                                            },
                                            children: "Top Up Groove Balance"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 806,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                window.scrollTo({
                                                    top: 0,
                                                    behavior: 'smooth'
                                                });
                                                setTimeout(()=>{
                                                    const profileButton = document.querySelector('[aria-label="Profile Menu"]');
                                                    if (profileButton) profileButton.click();
                                                }, 300);
                                            },
                                            className: "btn-secondary",
                                            style: {
                                                width: '100%',
                                                marginBottom: '12px',
                                                fontSize: '13px',
                                                padding: '10px',
                                                fontWeight: 600
                                            },
                                            children: "Edit Profile"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 807,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>router.push('/help'),
                                            className: "btn-secondary",
                                            style: {
                                                width: '100%',
                                                fontSize: '13px',
                                                padding: '10px',
                                                fontWeight: 600
                                            },
                                            children: "❓ Help & FAQs"
                                        }, void 0, false, {
                                            fileName: "[project]/pages/dashboard.tsx",
                                            lineNumber: 820,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 804,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 786,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/dashboard.tsx",
                    lineNumber: 507,
                    columnNumber: 11
                }, this),
                showTopUp && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-backdrop",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "modal-content",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "modal-title",
                                children: "Add to your Groove Balance"
                            }, void 0, false, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 829,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    gap: '8px',
                                    marginBottom: '16px'
                                },
                                children: [
                                    500,
                                    1000,
                                    1500
                                ].map((preset)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setTopUpAmount(preset),
                                        style: {
                                            flex: 1,
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            border: topUpAmount === preset ? 'none' : '2px solid #E5E7EB',
                                            background: topUpAmount === preset ? 'linear-gradient(135deg, #FF751F 0%, #FF8C42 100%)' : 'white',
                                            color: topUpAmount === preset ? 'white' : '#111827',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            fontFamily: 'Poppins, sans-serif'
                                        },
                                        children: [
                                            "R",
                                            preset
                                        ]
                                    }, preset, true, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 832,
                                        columnNumber: 21
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 830,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                type: "number",
                                min: 0,
                                step: 50,
                                placeholder: "Amount (ZAR)",
                                value: topUpAmount,
                                onChange: (e)=>setTopUpAmount(Number(e.target.value)),
                                style: {
                                    width: '100%',
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    border: '1px solid #E5E7EB',
                                    marginBottom: '12px',
                                    fontSize: '13px',
                                    boxSizing: 'border-box'
                                }
                            }, void 0, false, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 835,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    padding: '12px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '10px',
                                    marginBottom: '16px',
                                    fontSize: '12px',
                                    color: '#374151'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            "New Balance: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: [
                                                    confirmedPoints + topUpAmount,
                                                    " pts"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/pages/dashboard.tsx",
                                                lineNumber: 837,
                                                columnNumber: 37
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 837,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            "New Spots: ",
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: slotsAfter
                                            }, void 0, false, {
                                                fileName: "[project]/pages/dashboard.tsx",
                                                lineNumber: 838,
                                                columnNumber: 35
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 838,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 836,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    gap: '8px'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setShowTopUp(false),
                                        className: "btn-secondary",
                                        style: {
                                            flex: 1,
                                            fontSize: '13px',
                                            padding: '10px'
                                        },
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 841,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: handleTopUp,
                                        className: "btn-primary",
                                        style: {
                                            flex: 1,
                                            fontSize: '13px',
                                            padding: '10px'
                                        },
                                        children: "Add Groove Balance"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 842,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 840,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/dashboard.tsx",
                        lineNumber: 828,
                        columnNumber: 15
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/pages/dashboard.tsx",
                    lineNumber: 827,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        position: 'fixed',
                        top: 60,
                        right: 24,
                        zIndex: 50
                    }
                }, void 0, false, {
                    fileName: "[project]/pages/dashboard.tsx",
                    lineNumber: 848,
                    columnNumber: 13
                }, this),
                confirmationModal.isOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "modal-backdrop",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "modal-content",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                className: "modal-title",
                                children: confirmationModal.title
                            }, void 0, false, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 855,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                style: {
                                    margin: '0 0 16px 0',
                                    color: '#666',
                                    fontSize: '14px'
                                },
                                children: confirmationModal.message
                            }, void 0, false, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 856,
                                columnNumber: 17
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    display: 'flex',
                                    gap: '8px'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>setConfirmationModal({
                                                isOpen: false,
                                                title: '',
                                                message: '',
                                                onConfirm: ()=>{}
                                            }),
                                        disabled: confirmationModal.isLoading,
                                        className: "btn-secondary",
                                        style: {
                                            flex: 1,
                                            fontSize: '13px',
                                            padding: '10px',
                                            opacity: confirmationModal.isLoading ? 0.5 : 1
                                        },
                                        children: "Cancel"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 858,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: confirmationModal.onConfirm,
                                        disabled: confirmationModal.isLoading,
                                        className: "btn-primary",
                                        style: {
                                            flex: 1,
                                            fontSize: '13px',
                                            padding: '10px',
                                            opacity: confirmationModal.isLoading ? 0.5 : 1
                                        },
                                        children: confirmationModal.isLoading ? 'Processing...' : 'Confirm'
                                    }, void 0, false, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 859,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>router.push('/referrals'),
                                        className: "btn-secondary",
                                        style: {
                                            width: '100%',
                                            fontSize: '13px',
                                            padding: '10px',
                                            fontWeight: 600
                                        },
                                        children: "🎁 Refer & Earn"
                                    }, void 0, false, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 860,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 857,
                                columnNumber: 17
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/pages/dashboard.tsx",
                        lineNumber: 854,
                        columnNumber: 15
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/pages/dashboard.tsx",
                    lineNumber: 853,
                    columnNumber: 13
                }, this),
                isAdmin && showAdminPanel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        border: '1px solid #E5E7EB',
                        padding: '16px',
                        borderRadius: '12px',
                        marginTop: '16px',
                        backgroundColor: 'white'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            style: {
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#6B7280',
                                marginBottom: '12px'
                            },
                            children: "Admin Panel"
                        }, void 0, false, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 879,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: applyAdminPayment,
                            style: {
                                fontSize: '13px',
                                padding: '8px 12px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                background: 'white',
                                cursor: 'pointer',
                                marginBottom: '8px',
                                width: '100%'
                            },
                            children: "+500 points"
                        }, void 0, false, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 880,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                display: 'flex',
                                gap: '8px',
                                marginBottom: '8px'
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "number",
                                    min: 0,
                                    step: 50,
                                    value: backfillAmount,
                                    onChange: (e)=>setBackfillAmount(Number(e.target.value)),
                                    placeholder: "Amount",
                                    style: {
                                        flex: 1,
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        padding: '6px 10px',
                                        fontSize: '12px',
                                        boxSizing: 'border-box'
                                    }
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 882,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: backfillPayment,
                                    style: {
                                        fontSize: '13px',
                                        padding: '6px 12px',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        background: 'white',
                                        cursor: 'pointer'
                                    },
                                    children: "Apply"
                                }, void 0, false, {
                                    fileName: "[project]/pages/dashboard.tsx",
                                    lineNumber: 883,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 881,
                            columnNumber: 15
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>setShowAdminPanel(false),
                            style: {
                                fontSize: '12px',
                                padding: '8px 12px',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px',
                                background: 'white',
                                cursor: 'pointer',
                                opacity: 0.7,
                                width: '100%'
                            },
                            children: "Close"
                        }, void 0, false, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 885,
                            columnNumber: 15
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/dashboard.tsx",
                    lineNumber: 878,
                    columnNumber: 13
                }, this),
                adminNotifications.filter((n)=>!n.read).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    style: {
                        padding: '16px',
                        background: '#FEE2E2',
                        borderRadius: '12px',
                        border: '1px solid #FCA5A5',
                        marginBottom: '16px'
                    },
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                fontSize: '12px',
                                fontWeight: 700,
                                color: '#DC2626',
                                marginBottom: '8px'
                            },
                            children: [
                                "⚠️ ",
                                adminNotifications.filter((n)=>!n.read).length,
                                " Action",
                                adminNotifications.filter((n)=>!n.read).length > 1 ? 's' : '',
                                " Required"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/pages/dashboard.tsx",
                            lineNumber: 890,
                            columnNumber: 17
                        }, this),
                        adminNotifications.filter((n)=>!n.read).map((notif)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                style: {
                                    fontSize: '12px',
                                    color: '#991B1B',
                                    marginBottom: '6px',
                                    padding: '8px',
                                    background: 'white',
                                    borderRadius: '6px'
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: [
                                            notif.action,
                                            ":"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/pages/dashboard.tsx",
                                        lineNumber: 895,
                                        columnNumber: 21
                                    }, this),
                                    " ",
                                    notif.details
                                ]
                            }, notif.id, true, {
                                fileName: "[project]/pages/dashboard.tsx",
                                lineNumber: 894,
                                columnNumber: 17
                            }, this))
                    ]
                }, void 0, true, {
                    fileName: "[project]/pages/dashboard.tsx",
                    lineNumber: 889,
                    columnNumber: 13
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/pages/dashboard.tsx",
            lineNumber: 471,
            columnNumber: 9
        }, this)
    }, void 0, false);
}
_s(Dashboard, "HJFY13K2o6lPGQHu77Q0Ru8ypls=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$router$2e$js__$5b$client$5d$__$28$ecmascript$29$__["useRouter"]
    ];
});
_c = Dashboard;
var _c;
__turbopack_context__.k.register(_c, "Dashboard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[next]/entry/page-loader.ts { PAGE => \"[project]/pages/dashboard.tsx [client] (ecmascript)\" } [client] (ecmascript)", ((__turbopack_context__, module, exports) => {

const PAGE_PATH = "/dashboard";
(window.__NEXT_P = window.__NEXT_P || []).push([
    PAGE_PATH,
    ()=>{
        return __turbopack_context__.r("[project]/pages/dashboard.tsx [client] (ecmascript)");
    }
]);
// @ts-expect-error module.hot exists
if (module.hot) {
    // @ts-expect-error module.hot exists
    module.hot.dispose(function() {
        window.__NEXT_P.push([
            PAGE_PATH
        ]);
    });
}
}),
"[hmr-entry]/hmr-entry.js { ENTRY => \"[project]/pages/dashboard\" }", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.r("[next]/entry/page-loader.ts { PAGE => \"[project]/pages/dashboard.tsx [client] (ecmascript)\" } [client] (ecmascript)");
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__ff4ae0d2._.js.map
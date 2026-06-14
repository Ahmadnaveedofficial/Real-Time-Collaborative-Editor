import "./App.css";
import { Editor } from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import { useRef, useMemo, useState, useEffect } from "react";
import * as Y from "yjs";
import { SocketIOProvider } from "y-socket.io";

const App = () => {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);

  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username");
  });

  const [users, setUsers] = useState([]);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc]);

  const defaultCode = `// Welcome to your editor

function helloWorld() {
  console.log("Hello Ahmad!");
}

helloWorld();`;

const handleMount = (editor) => {
  editorRef.current = editor;

  const model = editor.getModel();

  if (!model) return;

  if (bindingRef.current) {
    bindingRef.current.destroy();
    bindingRef.current = null;
  }

  bindingRef.current = new MonacoBinding(
    yText,
    model,
    new Set([editor])
  );
};

  const handleJoin = (e) => {
    e.preventDefault();
    const val = e.target.username.value.trim();
    if (!val) return;
    setUsername(val);
    window.history.pushState({}, "", "?username=" + encodeURIComponent(val));
  };

 useEffect(() => {
  if (!username) return;

  const provider = new SocketIOProvider(
    window.location.origin,
    "monaco",
    ydoc,
    {
      autoConnect: true,
    }
  );

  provider.awareness.setLocalStateField("user", {
    username,
  });

  const updateUsers = () => {
    const states = Array.from(provider.awareness.getStates().values());

    setUsers(
      states
        .filter((state) => state.user?.username)
        .map((state) => state.user)
    );
  };

  updateUsers();

  provider.awareness.on("change", updateUsers);

  const handleBeforeUnload = () => {
    provider.awareness.setLocalStateField("user", null);
  };

  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    provider.awareness.off("change", updateUsers);

    provider.awareness.setLocalStateField("user", null);

    provider.disconnect();

    window.removeEventListener(
      "beforeunload",
      handleBeforeUnload
    );
  };
}, [username, ydoc]);


if (!username) {
  return (
    <main className="min-h-screen w-full bg-[#020617] flex items-center justify-center px-4 py-8">
      <form onSubmit={handleJoin} className="w-full max-w-sm sm:max-w-md">
        <div className="bg-[#111827] border border-gray-700 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
          <div className="h-10 sm:h-12 bg-[#1f2937] border-b border-gray-700 flex items-center px-4 gap-2">
            <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500"></span>
            <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500"></span>
            <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500"></span>
          </div>
          <div className="p-6 sm:p-8 flex flex-col gap-5 sm:gap-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Code Together</h1>
              <p className="text-gray-400 mt-2 text-sm sm:text-base">Join the collaborative coding room</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm text-gray-300">Username</label>
              <input
                type="text"
                name="username"
                placeholder="Enter your username"
                className="w-full p-3 rounded-xl bg-[#020617] border border-gray-700 text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-medium py-3 rounded-xl transition-all cursor-pointer text-sm sm:text-base"
            >
              Join Room
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}

return (
  <main className="h-screen w-full bg-gray-950 flex flex-col md:flex-row gap-2 sm:gap-3 p-2 sm:p-3 overflow-hidden">

    {/* Sidebar */}
    <aside className="
      w-full md:w-56 lg:w-64 xl:w-72
      h-28 sm:h-32 md:h-full
      bg-[#020617] rounded-xl sm:rounded-2xl border border-gray-700
      flex flex-col overflow-hidden shrink-0
    ">
      <div className="h-10 sm:h-12 bg-[#111827] border-b border-gray-700 flex items-center justify-between px-3 sm:px-4 shrink-0">
        <h2 className="text-white text-sm sm:text-base font-semibold">Users</h2>
        <span className="text-xs text-gray-400">{users.length} online</span>
      </div>

      <ul className="flex-1 p-2 sm:p-3 overflow-x-auto overflow-y-hidden md:overflow-x-hidden md:overflow-y-auto flex flex-row md:flex-col gap-2">
        {users.map((user, i) => (
          <li
            key={i}
            className="flex items-center gap-2 md:gap-3 p-2 md:p-3 bg-[#111827] border border-gray-700 rounded-xl text-white hover:bg-[#1f2937] transition shrink-0 min-w-[110px] md:min-w-0"
          >
            <div className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs sm:text-sm shrink-0">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-xs sm:text-sm truncate">{user.username}</span>
              <span className="text-xs text-green-400">online</span>
            </div>
          </li>
        ))}
      </ul>
    </aside>

    {/* Editor */}
    <section className="flex-1 min-h-0 bg-[#020617] rounded-xl sm:rounded-2xl border border-gray-700 overflow-hidden flex flex-col">
      <div className="h-10 sm:h-12 bg-[#111827] border-b border-gray-700 flex items-center px-3 sm:px-4 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-red-500"></span>
          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-yellow-500"></span>
          <span className="h-2.5 w-2.5 sm:h-3 sm:w-3 rounded-full bg-green-500"></span>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          defaultValue={defaultCode}
          theme="vs-dark"
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            wordWrap: "on",
            smoothScrolling: true,
            cursorBlinking: "smooth",
            automaticLayout: true,
            padding: { top: 12 },
            scrollbar: {
              vertical: "hidden",
              horizontal: "hidden",
              verticalScrollbarSize: 0,
              horizontalScrollbarSize: 0,
            },
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            scrollBeyondLastLine: false,
          }}
          onMount={handleMount}
        />
      </div>
    </section>

  </main>
);
}
export default App;
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Student = {
  id: string;
  name: string;
  email: string;
  department: string;
  imageUrl?: string;
};

async function gql(query: string, token: string) {
  const res = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({ query }),
  });
  return res.json();
}

export default function StudentsPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (!t) { router.push("/login"); return; }
    setToken(t);
    fetchStudents(t);
  }, []);

  async function fetchStudents(t: string) {
    const json = await gql(`query { students { id name email department imageUrl } }`, t);
    if (json.errors) { localStorage.removeItem("token"); router.push("/login"); return; }
    setStudents(json.data.students);
  }

  async function uploadImage(): Promise<string> {
    if (!imageFile) return imageUrl;
    setUploading(true);
    const form = new FormData();
    form.append("file", imageFile);
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const json = await res.json();
    setUploading(false);
    return json.url;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const uploadedUrl = await uploadImage();

    if (editingId) {
      const json = await gql(
        `mutation { updateStudent(id: "${editingId}", name: "${name}", email: "${email}", department: "${department}", imageUrl: "${uploadedUrl}") { id } }`,
        token
      );
      if (json.errors) { setError(json.errors[0].message); return; }
    } else {
      const json = await gql(
        `mutation { addStudent(name: "${name}", email: "${email}", department: "${department}", imageUrl: "${uploadedUrl}") { id } }`,
        token
      );
      if (json.errors) { setError(json.errors[0].message); return; }
    }

    resetForm();
    fetchStudents(token);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this student?")) return;
    await gql(`mutation { deleteStudent(id: "${id}") }`, token);
    fetchStudents(token);
  }

  function handleEdit(s: Student) {
    setEditingId(s.id);
    setName(s.name);
    setEmail(s.email);
    setDepartment(s.department);
    setImageUrl(s.imageUrl || "");
    setImageFile(null);
    setShowForm(true);
  }

  function resetForm() {
    setEditingId(null);
    setName(""); setEmail(""); setDepartment(""); setImageUrl(""); setImageFile(null);
    setShowForm(false);
  }

  return (
    <div style={{ padding: "24px" }}>

      {/* header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>Student Profiles</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => { resetForm(); setShowForm(true); }}>+ Add Student</button>
          <button onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}>Logout</button>
        </div>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {/* add / edit form */}
      {showForm && (
        <div style={{ marginBottom: "24px", maxWidth: "420px" }}>
          <h2>{editingId ? "Edit Student" : "Add Student"}</h2>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input type="text" placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="text" placeholder="Department" value={department} onChange={(e) => setDepartment(e.target.value)} required />

            <label>Profile Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                setImageFile(f);
                if (f) setImageUrl(URL.createObjectURL(f));
              }}
            />

            {imageUrl && (
              <Image
                src={imageUrl}
                alt="preview"
                width={80}
                height={80}
                unoptimized
                style={{ borderRadius: "50%", objectFit: "cover" }}
              />
            )}

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" disabled={uploading}>
                {uploading ? "Uploading..." : editingId ? "Update" : "Add"}
              </button>
              <button type="button" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* students grid */}
      {students.length === 0 ? (
        <p>No students yet. Click &quot;+ Add Student&quot; to begin.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "16px" }}>
          {students.map((s) => (
            <div key={s.id} style={{ textAlign: "center", padding: "16px" }}>
              {s.imageUrl ? (
                <Image
                  src={s.imageUrl}
                  alt={s.name}
                  width={80}
                  height={80}
                  unoptimized
                  style={{ borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#ccc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", margin: "0 auto" }}>
                  {s.name[0].toUpperCase()}
                </div>
              )}

              <p><strong>{s.name}</strong></p>
              <p>{s.email}</p>
              <p>{s.department}</p>

              <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "8px" }}>
                <button onClick={() => handleEdit(s)}>Edit</button>
                <button onClick={() => handleDelete(s.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

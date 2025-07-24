import { redirect } from "next/navigation";
import createClient from "@/lib/supabase/server";

export default async function TestAuthPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erro de Autenticação</h1>
          <p className="text-gray-600 mb-4">{error.message}</p>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-green-600 text-center">
          ✅ Autenticação Funcionando!
        </h1>
        
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-lg font-semibold">Dados do Usuário:</h2>
          
          <div>
            <strong>ID:</strong> {user.id}
          </div>
          
          <div>
            <strong>Email:</strong> {user.email}
          </div>
          
          <div>
            <strong>Email Confirmado:</strong> {user.email_confirmed_at ? "Sim" : "Não"}
          </div>
          
          <div>
            <strong>Último Login:</strong> {user.last_sign_in_at || "Nunca"}
          </div>
          
          <div>
            <strong>Criado em:</strong> {new Date(user.created_at).toLocaleString('pt-BR')}
          </div>
        </div>

        {profile && (
          <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
            <h2 className="text-lg font-semibold">Perfil do Banco:</h2>
            
            <div>
              <strong>Nome:</strong> {profile.full_name}
            </div>
            
            <div>
              <strong>Email:</strong> {profile.email}
            </div>
            
            <div>
              <strong>Criado em:</strong> {new Date(profile.created_at).toLocaleString('pt-BR')}
            </div>
          </div>
        )}

        <div className="text-center">
          <a 
            href="/dashboard" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Ir para Dashboard
          </a>
        </div>
      </div>
    </div>
  );
} 
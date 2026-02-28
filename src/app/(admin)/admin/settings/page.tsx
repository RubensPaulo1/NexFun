'use client'

import { useState } from 'react'
import { Settings, Database, Server, Shield, Bell, Mail, Save, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toaster'

export default function AdminSettingsPage() {
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    // TODO: Implement settings save
    setTimeout(() => {
      toast({
        title: 'Configurações salvas',
        description: 'As alterações foram aplicadas com sucesso.',
        variant: 'success',
      })
      setSaving(false)
    }, 1000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-headline text-display-sm text-white">Configurações do Sistema</h1>
        <p className="text-body-md text-white/60">
          Controle técnico e configurações da plataforma
        </p>
      </div>

      {/* System Info */}
      <Card className="bg-graphite border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Server className="h-5 w-5 text-nex-blue" />
            Informações do Sistema
          </CardTitle>
          <CardDescription className="text-white/60">
            Status e informações técnicas da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-nex bg-white/5">
              <p className="text-caption text-white/50 mb-1">Ambiente</p>
              <p className="text-body-sm font-medium text-white">
                {process.env.NODE_ENV === 'production' ? 'Produção' : 'Desenvolvimento'}
              </p>
            </div>
            <div className="p-4 rounded-nex bg-white/5">
              <p className="text-caption text-white/50 mb-1">Banco de Dados</p>
              <p className="text-body-sm font-medium text-white">SQLite</p>
            </div>
            <div className="p-4 rounded-nex bg-white/5">
              <p className="text-caption text-white/50 mb-1">Versão</p>
              <p className="text-body-sm font-medium text-white">1.0.0</p>
            </div>
            <div className="p-4 rounded-nex bg-white/5">
              <p className="text-caption text-white/50 mb-1">Status</p>
              <Badge variant="gradient" className="mt-1">
                <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2" />
                Online
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="bg-graphite border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-nex-blue" />
            Segurança
          </CardTitle>
          <CardDescription className="text-white/60">
            Configurações de segurança e autenticação
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="input-label mb-2">Taxa de Limite de Requisições</label>
            <Input
              type="number"
              defaultValue="100"
              className="bg-white/5 border-white/10 text-white"
              placeholder="Requisições por minuto"
            />
          </div>
          <div>
            <label className="input-label mb-2">Tempo de Sessão (dias)</label>
            <Input
              type="number"
              defaultValue="30"
              className="bg-white/5 border-white/10 text-white"
              placeholder="Dias"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-mid-gray text-nex-blue focus:ring-nex-blue/30"
            />
            <label className="text-body-sm text-white/70">
              Exigir verificação de email para novos usuários
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-mid-gray text-nex-blue focus:ring-nex-blue/30"
            />
            <label className="text-body-sm text-white/70">
              Habilitar autenticação de dois fatores para admins
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-graphite border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-nex-blue" />
            Notificações
          </CardTitle>
          <CardDescription className="text-white/60">
            Configurações de notificações do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-mid-gray text-nex-blue focus:ring-nex-blue/30"
            />
            <label className="text-body-sm text-white/70">
              Notificar sobre novas denúncias
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-mid-gray text-nex-blue focus:ring-nex-blue/30"
            />
            <label className="text-body-sm text-white/70">
              Notificar sobre solicitações de verificação
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 rounded border-mid-gray text-nex-blue focus:ring-nex-blue/30"
            />
            <label className="text-body-sm text-white/70">
              Notificar sobre novos usuários
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card className="bg-graphite border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Mail className="h-5 w-5 text-nex-blue" />
            Email
          </CardTitle>
          <CardDescription className="text-white/60">
            Configurações de envio de emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="input-label mb-2">SMTP Host</label>
            <Input
              defaultValue="smtp.example.com"
              className="bg-white/5 border-white/10 text-white"
              placeholder="smtp.example.com"
            />
          </div>
          <div>
            <label className="input-label mb-2">SMTP Port</label>
            <Input
              type="number"
              defaultValue="587"
              className="bg-white/5 border-white/10 text-white"
              placeholder="587"
            />
          </div>
          <div>
            <label className="input-label mb-2">Email do Remetente</label>
            <Input
              type="email"
              defaultValue="noreply@nexfan.com"
              className="bg-white/5 border-white/10 text-white"
              placeholder="noreply@nexfan.com"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-nex-blue hover:bg-nex-blue/90"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </div>
  )
}



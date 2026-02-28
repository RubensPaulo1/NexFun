import { Metadata } from 'next'
import { Card, CardContent } from '@/components/ui/card'
import { Shield, Check, X, AlertTriangle, FileText, Scale, UserCheck, Eye, Ban, RefreshCw } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Conteúdo',
  description: 'Política de Conteúdo da NexFan - Diretrizes sobre o que é permitido, proibido e condicionado na plataforma',
}

export default function ContentPolicyPage() {
  return (
    <div className="min-h-screen bg-soft-gray py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-nex-blue/10 mb-4">
            <Shield className="h-8 w-8 text-nex-blue" />
          </div>
          <h1 className="font-headline text-display-md text-deep-navy mb-3">
            Política de Conteúdo
          </h1>
          <p className="text-body-md text-graphite/60">
            Diretrizes sobre o que é permitido, proibido e condicionado na plataforma NexFan
          </p>
          <p className="text-body-sm text-graphite/50 mt-2">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Section 1 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-nex-blue" />
                1. Objetivo
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-body-md text-graphite/80 mb-3">
                  A <strong>NexFan</strong> é uma plataforma que conecta <strong>Criadores</strong> e <strong>Assinantes</strong> para distribuição de conteúdo digital exclusivo.
                </p>
                <p className="text-body-md text-graphite/80">
                  Esta Política estabelece o que é permitido, proibido e condicionado dentro da plataforma, garantindo segurança, legalidade e respeito para todos os usuários.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-green-500" />
                2. Conteúdos Permitidos
              </h2>
              <p className="text-body-md text-graphite/80 mb-4">
                A NexFan permite que Criadores publiquem:
              </p>
              
              <div className="space-y-4">
                <div className="bg-soft-gray rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-3">
                    ✔ Conteúdos artísticos
                  </h3>
                  <ul className="space-y-2 text-body-sm text-graphite/70 list-disc list-inside">
                    <li>Fotografia</li>
                    <li>Vídeo</li>
                    <li>Artes digitais</li>
                    <li>Ensaios autorais</li>
                  </ul>
                </div>

                <div className="bg-soft-gray rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-3">
                    ✔ Conteúdos de entretenimento adulto (18+)
                  </h3>
                  <ul className="space-y-2 text-body-sm text-graphite/70 list-disc list-inside">
                    <li>Imagens, vídeos e lives com nudez consensual</li>
                    <li>Conteúdos eróticos produzidos pelo próprio criador</li>
                    <li>Conteúdos sensuais não explícitos</li>
                  </ul>
                  <p className="text-body-sm text-graphite/60 mt-3 italic">
                    Todos os conteúdos adultos devem estar de acordo com as leis brasileiras e à verificação de idade obrigatória.
                  </p>
                </div>

                <div className="bg-soft-gray rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-3">
                    ✔ Conteúdos educativos e informativos
                  </h3>
                  <ul className="space-y-2 text-body-sm text-graphite/70 list-disc list-inside">
                    <li>Cursos</li>
                    <li>Tutoriais</li>
                    <li>Conteúdos técnicos</li>
                    <li>Consultorias</li>
                  </ul>
                </div>

                <div className="bg-soft-gray rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-3">
                    ✔ Conteúdos de lifestyle e cotidiano
                  </h3>
                  <ul className="space-y-2 text-body-sm text-graphite/70 list-disc list-inside">
                    <li>Vlogs</li>
                    <li>Bastidores</li>
                    <li>Rotina pessoal</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card className="border-destructive/20">
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <X className="h-5 w-5 text-destructive" />
                3. Conteúdos Proibidos (Tolerância Zero)
              </h2>
              <p className="text-body-md text-graphite/80 mb-4">
                A NexFan não permite, sob nenhuma circunstância:
              </p>
              
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-2 flex items-center gap-2">
                    <Ban className="h-4 w-4 text-destructive" />
                    ❌ Conteúdo envolvendo menores (qualquer pessoa &lt;18 anos)
                  </h3>
                  <ul className="space-y-1 text-body-sm text-graphite/70 list-disc list-inside ml-6">
                    <li>Aparições, mesmo que sem nudez</li>
                    <li>Voz, imagem, referência sexual</li>
                    <li>Produção, solicitação ou distribuição</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
                    ❌ Conteúdo não consensual
                  </h3>
                  <ul className="space-y-1 text-body-sm text-graphite/70 list-disc list-inside ml-6">
                    <li>Gravações sem consentimento</li>
                    <li>Vingança pornográfica (revenge porn)</li>
                    <li>Divulgação indevida de material de terceiros</li>
                  </ul>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
                    ❌ Outros conteúdos proibidos
                  </h3>
                  <ul className="space-y-1 text-body-sm text-graphite/70 list-disc list-inside ml-6">
                    <li>Exploração sexual, tráfico ou coerção</li>
                    <li>Conteúdos que glamurizem ou instruam práticas ilegais (drogas ilícitas, violência extrema, instruções para atividades criminosas)</li>
                    <li>Atos sexuais perigosos ou que representem risco real (automutilação sexualizada, zoofilia, necrofilia, incesto mesmo fictício)</li>
                    <li>Discurso de ódio, assédio ou discriminação</li>
                    <li>Fraudes, golpes ou pedidos de dinheiro fora da plataforma</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card className="border-yellow-200">
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                4. Conteúdos Condicionados (Permitidos com Regras)
              </h2>
              <p className="text-body-md text-graphite/80 mb-4">
                Alguns conteúdos são permitidos, mas exigem cuidado:
              </p>
              
              <div className="space-y-3">
                <div className="bg-yellow-50 border border-yellow-200 rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
                    🔶 Conteúdo erótico com temática fictícia
                  </h3>
                  <p className="text-body-sm text-graphite/70">
                    Permitido desde que não envolva menores, violência real ou apologia ao crime.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
                    🔶 Conteúdos de cosplay
                  </h3>
                  <p className="text-body-sm text-graphite/70">
                    Permitido, desde que não sexualize personagens que sejam representados como menores em qualquer mídia.
                  </p>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-nex p-4">
                  <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
                    🔶 Conteúdos sugestivos, mas não explícitos
                  </h3>
                  <p className="text-body-sm text-graphite/70">
                    Permitido, desde que não inclua nudez infantil, mesmo que não sexualizada.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-nex-blue" />
                5. Responsabilidades do Criador
              </h2>
              <p className="text-body-md text-graphite/80 mb-4">
                O Criador concorda em:
              </p>
              <ul className="space-y-2 text-body-sm text-graphite/70 list-disc list-inside">
                <li>Garantir que todo conteúdo publicado é de sua autoria</li>
                <li>Manter provas de consentimento de todas as pessoas que aparecem nas publicações</li>
                <li>Garantir que todos os participantes têm 18 anos ou mais</li>
                <li>Cumprir leis locais, nacionais e internacionais</li>
                <li>Não publicar dados pessoais de terceiros</li>
                <li>Respeitar a privacidade dos Assinantes</li>
              </ul>
              <p className="text-body-sm text-destructive mt-4 font-medium">
                A conta pode ser encerrada sem aviso prévio caso haja violação grave.
              </p>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <Eye className="h-5 w-5 text-nex-blue" />
                6. Responsabilidades dos Assinantes
              </h2>
              <p className="text-body-md text-graphite/80 mb-4">
                Os Assinantes devem:
              </p>
              <ul className="space-y-2 text-body-sm text-graphite/70 list-disc list-inside">
                <li>Não compartilhar, gravar, distribuir ou revender conteúdo de Criadores</li>
                <li>Não solicitar conteúdo ilegal, não consensual ou proibido</li>
                <li>Não assediar ou pressionar Criadores</li>
              </ul>
              <p className="text-body-sm text-destructive mt-4 font-medium">
                Violação resulta em banimento permanente.
              </p>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-nex-blue" />
                7. Fiscalização e Moderação
              </h2>
              <p className="text-body-md text-graphite/80 mb-4">
                A NexFan utiliza:
              </p>
              <ul className="space-y-2 text-body-sm text-graphite/70 list-disc list-inside">
                <li>Moderadores humanos</li>
                <li>Análise de denúncias</li>
                <li>Sistemas automáticos de detecção de violação</li>
                <li>Suspensão preventiva em casos suspeitos</li>
              </ul>
              <p className="text-body-sm text-graphite/60 mt-4">
                Qualquer usuário pode denunciar conteúdo impróprio.
              </p>
            </CardContent>
          </Card>

          {/* Section 8 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <Scale className="h-5 w-5 text-nex-blue" />
                8. Consequências por Violação
              </h2>
              <p className="text-body-md text-graphite/80 mb-4">
                Dependendo da gravidade:
              </p>
              <ul className="space-y-2 text-body-sm text-graphite/70 list-disc list-inside">
                <li>Aviso</li>
                <li>Remoção de conteúdo</li>
                <li>Suspensão temporária</li>
                <li>Banimento permanente</li>
                <li>Encaminhamento às autoridades (em casos de crime)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 9 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-nex-blue" />
                9. Uso Comercial e Direitos
              </h2>
              <ul className="space-y-2 text-body-sm text-graphite/70 list-disc list-inside">
                <li>A propriedade do conteúdo permanece com o Criador</li>
                <li>A NexFan recebe permissão de hospedagem e distribuição dentro da plataforma</li>
                <li>A NexFan pode remover conteúdos que violem seus Termos, sem reembolso</li>
              </ul>
            </CardContent>
          </Card>

          {/* Section 10 */}
          <Card>
            <CardContent className="p-6">
              <h2 className="font-headline text-heading-lg text-deep-navy mb-4 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-nex-blue" />
                10. Atualização da Política
              </h2>
              <p className="text-body-md text-graphite/80 mb-3">
                A NexFan pode atualizar esta Política a qualquer momento para refletir mudanças legais ou operacionais.
              </p>
              <p className="text-body-sm text-graphite/60">
                Mudanças entrarão em vigor após publicação.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-nex-blue/5 border-nex-blue/20">
            <CardContent className="p-6 text-center">
              <h3 className="font-headline text-heading-sm text-deep-navy mb-2">
                Dúvidas ou Denúncias?
              </h3>
              <p className="text-body-sm text-graphite/70 mb-4">
                Se você tiver dúvidas sobre esta política ou precisar denunciar conteúdo impróprio, entre em contato conosco.
              </p>
              <p className="text-body-sm text-graphite/60">
                Email: <a href="mailto:support@nexfan.com" className="text-nex-blue hover:underline">support@nexfan.com</a>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}





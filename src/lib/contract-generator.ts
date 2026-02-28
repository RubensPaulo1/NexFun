interface CreatorContractData {
  creatorName: string
  creatorEmail: string
  fullName: string
  cpf: string
  rg: string
  rgIssuer?: string | null
  birthDate?: string | null
  signedAt: Date
  ipAddress?: string | null
}

export function generateCreatorContract(data: CreatorContractData): string {
  const formatCPF = (cpf: string) => {
    const cleaned = cpf.replace(/\D/g, '')
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const contractDate = formatDate(data.signedAt)
  const formattedCPF = formatCPF(data.cpf)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato do Criador - NexFan</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            line-height: 1.6;
            color: #333;
            background: #fff;
            padding: 40px 20px;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: #fff;
            padding: 40px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        h1 {
            text-align: center;
            color: #3366FF;
            margin-bottom: 10px;
            font-size: 24px;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 14px;
        }
        .parties {
            margin: 30px 0;
            padding: 20px;
            background: #f5f7fa;
            border-radius: 8px;
        }
        .party {
            margin-bottom: 15px;
        }
        .party strong {
            display: block;
            margin-bottom: 5px;
            color: #0A0D1A;
        }
        .section {
            margin: 25px 0;
        }
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #0A0D1A;
            margin-bottom: 10px;
            border-bottom: 2px solid #3366FF;
            padding-bottom: 5px;
        }
        .section-content {
            text-align: justify;
            margin-bottom: 15px;
            font-size: 12px;
        }
        .section-content ul {
            margin-left: 20px;
            margin-top: 10px;
        }
        .section-content li {
            margin-bottom: 8px;
        }
        .signature {
            margin-top: 50px;
            padding-top: 30px;
            border-top: 2px solid #ddd;
        }
        .signature-row {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
        }
        .signature-box {
            text-align: center;
            width: 45%;
            padding: 20px;
            border-top: 1px solid #333;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 11px;
            color: #666;
        }
        @media print {
            body {
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>CONTRATO DO CRIADOR – NEXFAN</h1>
        <p class="subtitle">Última atualização: Janeiro 2025</p>
        
        <div class="parties">
            <div class="party">
                <strong>Entre:</strong>
                <div>NexFan Plataforma Digital Ltda., doravante denominada "NexFan",</div>
            </div>
            <div class="party">
                <strong>e o usuário registrado como Criador:</strong>
                <div>Nome: ${data.fullName}</div>
                <div>CPF: ${formattedCPF}</div>
                <div>RG: ${data.rg}${data.rgIssuer ? ` - ${data.rgIssuer}` : ''}</div>
                ${data.birthDate ? `<div>Data de Nascimento: ${data.birthDate}</div>` : ''}
                <div>Email: ${data.creatorEmail}</div>
                <div>Nome Artístico: ${data.creatorName}</div>
                <div>doravante denominado "Criador".</div>
            </div>
        </div>

        <p style="text-align: justify; margin: 20px 0;">
            Ambas as partes concordam com os termos abaixo.
        </p>

        <div class="section">
            <div class="section-title">1. Objeto do Contrato</div>
            <div class="section-content">
                <p><strong>1.1.</strong> O presente contrato regula a participação do Criador na plataforma NexFan, permitindo a publicação, venda e distribuição de conteúdo digital exclusivo aos Assinantes.</p>
                <p><strong>1.2.</strong> A NexFan fornece infraestrutura tecnológica de hospedagem, cobrança, repasse financeiro e ferramentas de interação entre Criador e Assinantes.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">2. Cadastro e Elegibilidade</div>
            <div class="section-content">
                <p><strong>2.1.</strong> O Criador declara que possui 18 anos completos e capacidade legal para firmar o presente contrato.</p>
                <p><strong>2.2.</strong> O Criador deve fornecer informações reais e atualizadas, incluindo documentos para verificação de identidade.</p>
                <p><strong>2.3.</strong> A NexFan poderá solicitar comprovação adicional de idade, propriedade do conteúdo e consentimento de participantes.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">3. Publicação de Conteúdo</div>
            <div class="section-content">
                <p><strong>3.1.</strong> O Criador pode publicar textos, fotos, vídeos, áudios e transmissões ao vivo ("Conteúdo"), desde que observadas as leis vigentes e a Política de Conteúdo da NexFan.</p>
                <p><strong>3.2.</strong> O Criador declara ser o único titular dos direitos autorais e de imagem de todo conteúdo publicado, ou possuir autorização comprovável.</p>
                <p><strong>3.3.</strong> É vedada a inclusão de terceiros sem consentimento explícito e documentação adequada.</p>
                <p><strong>3.4.</strong> O Criador é responsável por garantir que nenhum conteúdo inclua menores de 18 anos, mesmo de forma não sexualizada.</p>
                <p><strong>3.5.</strong> A NexFan poderá remover conteúdos que violem políticas internas, leis ou direitos de terceiros, sem reembolso.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">4. Relação entre Criador e Assinantes</div>
            <div class="section-content">
                <p><strong>4.1.</strong> O Criador recebe valores provenientes das assinaturas adquiridas pelos Assinantes.</p>
                <p><strong>4.2.</strong> O Criador concorda em não:</p>
                <ul>
                    <li>solicitar transações fora da plataforma,</li>
                    <li>vender conteúdo ilegal,</li>
                    <li>assediar Assinantes,</li>
                    <li>vazar informações pessoais.</li>
                </ul>
                <p><strong>4.3.</strong> O Assinante NÃO tem permissão para redistribuir conteúdos do Criador.</p>
                <p><strong>4.4.</strong> A NexFan não se responsabiliza por interações fora da plataforma.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">5. Modelo de Pagamento e Repasse</div>
            <div class="section-content">
                <p><strong>5.1.</strong> A NexFan cobrará uma taxa de comissão sobre o valor total recebido. A taxa atual é de 8%, podendo ser alterada mediante aviso prévio de 30 dias.</p>
                <p><strong>5.2.</strong> Repasse será feito através de sistema Stripe Connect ou transferência equivalente, em moeda BRL, mediante solicitação do Criador.</p>
                <p><strong>5.3.</strong> O Criador é responsável por fornecer dados bancários válidos.</p>
                <p><strong>5.4.</strong> A NexFan não se responsabiliza por atrasos decorrentes de:</p>
                <ul>
                    <li>dados incorretos,</li>
                    <li>bloqueio regulatório,</li>
                    <li>verificação de segurança,</li>
                    <li>instituições financeiras terceiras.</li>
                </ul>
                <p><strong>5.5.</strong> Saques podem ser feitos mensalmente, com valor mínimo estabelecido.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">6. Obrigações Fiscais</div>
            <div class="section-content">
                <p><strong>6.1.</strong> O Criador reconhece que atua de forma independente e não possui vínculo empregatício com a NexFan.</p>
                <p><strong>6.2.</strong> O Criador é responsável pelo pagamento de impostos, contribuições e declarações fiscais referentes à própria renda.</p>
                <p><strong>6.3.</strong> A NexFan poderá fornecer relatórios anuais de movimentação para facilitar declaração de imposto.</p>
                <p><strong>6.4.</strong> A NexFan não é responsável por débitos fiscais do Criador.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">7. Licença de Uso</div>
            <div class="section-content">
                <p><strong>7.1.</strong> O Criador concede à NexFan uma licença não exclusiva, mundial e revogável para:</p>
                <ul>
                    <li>armazenar,</li>
                    <li>exibir,</li>
                    <li>distribuir para Assinantes,</li>
                    <li>transmitir e processar seus conteúdos dentro da plataforma.</li>
                </ul>
                <p><strong>7.2.</strong> A NexFan não adquire propriedade sobre o conteúdo.</p>
                <p><strong>7.3.</strong> Após encerramento da conta, a NexFan poderá manter conteúdos por até 180 dias por razões legais, contábeis ou de auditoria.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">8. Privacidade e Segurança</div>
            <div class="section-content">
                <p><strong>8.1.</strong> O Criador deve manter sigilo das credenciais de acesso.</p>
                <p><strong>8.2.</strong> A NexFan emprega medidas técnicas de segurança, mas não garante proteção absoluta contra ataques externos.</p>
                <p><strong>8.3.</strong> O Criador deve reportar uso indevido ou violação de conta imediatamente.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">9. Suspensão e Encerramento</div>
            <div class="section-content">
                <p><strong>9.1.</strong> A NexFan pode suspender ou encerrar contas por:</p>
                <ul>
                    <li>violação de políticas,</li>
                    <li>fraude,</li>
                    <li>denúncias fundamentadas,</li>
                    <li>conteúdos ilegais,</li>
                    <li>uso abusivo da plataforma.</li>
                </ul>
                <p><strong>9.2.</strong> O Criador pode encerrar a conta a qualquer momento, desde que não haja:</p>
                <ul>
                    <li>pendências financeiras,</li>
                    <li>investigações abertas,</li>
                    <li>violações graves.</li>
                </ul>
                <p><strong>9.3.</strong> Em casos de violação grave, valores pendentes podem ser retidos.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">10. Limitação de Responsabilidade</div>
            <div class="section-content">
                <p><strong>10.1.</strong> A NexFan não garante:</p>
                <ul>
                    <li>número de assinantes,</li>
                    <li>receita mínima,</li>
                    <li>resultado financeiro,</li>
                    <li>disponibilidade ininterrupta do serviço.</li>
                </ul>
                <p><strong>10.2.</strong> A NexFan não é responsável por danos indiretos, lucros cessantes ou perda de dados causada pelo Criador.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">11. Alterações Contratuais</div>
            <div class="section-content">
                <p><strong>11.1.</strong> A NexFan poderá alterar este contrato mediante aviso prévio no painel do Criador.</p>
                <p><strong>11.2.</strong> O uso contínuo da plataforma após a atualização implica aceitação dos novos termos.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">12. Foro</div>
            <div class="section-content">
                <p><strong>12.1.</strong> Para dirimir controvérsias, as partes elegem o foro da comarca do Rio De Janeiro, renunciando a qualquer outro, por mais privilegiado que seja.</p>
            </div>
        </div>

        <div class="section">
            <div class="section-title">13. Aceite Digital</div>
            <div class="section-content">
                <p>Ao clicar em "Aceito", o Criador declara que leu, compreendeu e concorda integralmente com este Contrato, com a Política de Conteúdo, com os Termos de Uso e com a Política de Privacidade da NexFan.</p>
            </div>
        </div>

        <div class="signature">
            <p style="text-align: center; margin-bottom: 20px;">
                <strong>Assinado digitalmente em ${contractDate}</strong>
            </p>
            <div class="signature-row">
                <div class="signature-box">
                    <div style="margin-bottom: 60px;"></div>
                    <div>NexFan Plataforma Digital Ltda.</div>
                    <div style="font-size: 10px; margin-top: 5px;">Plataforma</div>
                </div>
                <div class="signature-box">
                    <div style="margin-bottom: 60px;"></div>
                    <div>${data.fullName}</div>
                    <div style="font-size: 10px; margin-top: 5px;">Criador</div>
                    <div style="font-size: 10px; margin-top: 10px;">CPF: ${formattedCPF}</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Contrato gerado automaticamente pela plataforma NexFan</p>
            <p>IP de assinatura: ${data.ipAddress || 'Não registrado'}</p>
            <p>Versão do contrato: 1.0</p>
        </div>
    </div>
</body>
</html>`
}





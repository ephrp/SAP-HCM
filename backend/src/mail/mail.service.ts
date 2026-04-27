import { Injectable, Logger } from '@nestjs/common';
import sgMail from '@sendgrid/mail';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;

    if (!apiKey) {
      throw new Error('SENDGRID_API_KEY is not defined');
    }

    sgMail.setApiKey(apiKey);
  }

  async sendAccountCreationEmail(params: {
    to: string;
    firstName: string;
    role: string;
    temporaryPassword: string;
  }) {
    const from = process.env.MAIL_FROM;

    if (!from) {
      throw new Error('MAIL_FROM is not defined');
    }

    const msg = {
      to: params.to,
      from,
      subject: 'Votre compte SAP HCM a été créé',
      text: `Bonjour ${params.firstName},

Votre compte SAP HCM a été créé.

Rôle : ${params.role}
Email : ${params.to}
Mot de passe temporaire : ${params.temporaryPassword}

Merci de changer ce mot de passe à votre première connexion.
`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Bienvenue sur SAP HCM</h2>
          <p>Bonjour ${params.firstName},</p>
          <p>Votre compte a été créé avec succès.</p>
          <p><strong>Rôle :</strong> ${params.role}</p>
          <p><strong>Email :</strong> ${params.to}</p>
          <p><strong>Mot de passe temporaire :</strong> ${params.temporaryPassword}</p>
          <p>Merci de modifier ce mot de passe à votre première connexion.</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email de création de compte envoyé à ${params.to}`);
    } catch (error) {
      this.logger.error(
        `Échec d’envoi à ${params.to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async sendLeaveCreatedToManagerEmail(params: {
    to: string;
    managerFirstName: string;
    employeeFullName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    note?: string;
  }) {
    const from = process.env.MAIL_FROM;

    if (!from) {
      throw new Error('MAIL_FROM is not defined');
    }

    const msg = {
      to: params.to,
      from,
      subject: 'Nouvelle demande de congé à valider',
      text: `Bonjour ${params.managerFirstName},

Une nouvelle demande de congé a été soumise.

Employé : ${params.employeeFullName}
Type : ${params.leaveType}
Période : ${params.startDate} au ${params.endDate}
Nombre de jours : ${params.days}
${params.note ? `Note : ${params.note}` : ''}

Merci de vous connecter à PeopleFlow pour la traiter.
`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Nouvelle demande de congé 📩</h2>
          <p>Bonjour ${params.managerFirstName},</p>
          <p>Une nouvelle demande de congé a été soumise et nécessite votre validation.</p>
          <p><strong>Employé :</strong> ${params.employeeFullName}</p>
          <p><strong>Type :</strong> ${params.leaveType}</p>
          <p><strong>Période :</strong> ${params.startDate} au ${params.endDate}</p>
          <p><strong>Nombre de jours :</strong> ${params.days}</p>
          ${
            params.note
              ? `<p><strong>Note :</strong> ${params.note}</p>`
              : ''
          }
          <p>Merci de vous connecter à PeopleFlow pour traiter cette demande.</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email de nouvelle demande de congé envoyé à ${params.to}`);
    } catch (error) {
      this.logger.error(
        `Échec d’envoi à ${params.to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async sendLeaveApprovedEmail(params: {
    to: string;
    firstName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
  }) {
    const from = process.env.MAIL_FROM;

    if (!from) {
      throw new Error('MAIL_FROM is not defined');
    }

    const msg = {
      to: params.to,
      from,
      subject: 'Votre demande de congé a été approuvée',
      text: `Bonjour ${params.firstName},

Votre demande de congé a été approuvée.

Type : ${params.leaveType}
Période : ${params.startDate} au ${params.endDate}
Nombre de jours : ${params.days}

Cordialement,
L’équipe PeopleFlow
`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Congé approuvé ✅</h2>
          <p>Bonjour ${params.firstName},</p>
          <p>Votre demande de congé a été approuvée.</p>
          <p><strong>Type :</strong> ${params.leaveType}</p>
          <p><strong>Période :</strong> ${params.startDate} au ${params.endDate}</p>
          <p><strong>Nombre de jours :</strong> ${params.days}</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email de congé approuvé envoyé à ${params.to}`);
    } catch (error) {
      this.logger.error(
        `Échec d’envoi à ${params.to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async sendLeaveRejectedEmail(params: {
    to: string;
    firstName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    days: number;
    rejectionReason: string;
  }) {
    const from = process.env.MAIL_FROM;

    if (!from) {
      throw new Error('MAIL_FROM is not defined');
    }

    const msg = {
      to: params.to,
      from,
      subject: 'Votre demande de congé a été refusée',
      text: `Bonjour ${params.firstName},

Votre demande de congé a été refusée.

Type : ${params.leaveType}
Période : ${params.startDate} au ${params.endDate}
Nombre de jours : ${params.days}
Motif : ${params.rejectionReason}

Cordialement,
L’équipe PeopleFlow
`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Congé refusé ❌</h2>
          <p>Bonjour ${params.firstName},</p>
          <p>Votre demande de congé a été refusée.</p>
          <p><strong>Type :</strong> ${params.leaveType}</p>
          <p><strong>Période :</strong> ${params.startDate} au ${params.endDate}</p>
          <p><strong>Nombre de jours :</strong> ${params.days}</p>
          <p><strong>Motif :</strong> ${params.rejectionReason}</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email de congé refusé envoyé à ${params.to}`);
    } catch (error) {
      this.logger.error(
        `Échec d’envoi à ${params.to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async sendTrainingAssignedEmail(params: {
    to: string;
    firstName: string;
    trainingTitle: string;
    category: string;
    provider: string;
    dueDate?: string;
  }) {
    const from = process.env.MAIL_FROM;

    if (!from) {
      throw new Error('MAIL_FROM is not defined');
    }

    const msg = {
      to: params.to,
      from,
      subject: 'Une nouvelle formation vous a été assignée',
      text: `Bonjour ${params.firstName},

Une nouvelle formation vous a été assignée.

Formation : ${params.trainingTitle}
Catégorie : ${params.category}
Organisme : ${params.provider}
${params.dueDate ? `Échéance : ${params.dueDate}` : ''}

Merci de vous connecter à PeopleFlow pour consulter votre progression.
`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Nouvelle formation assignée 🎓</h2>
          <p>Bonjour ${params.firstName},</p>
          <p>Une nouvelle formation vous a été assignée.</p>
          <p><strong>Formation :</strong> ${params.trainingTitle}</p>
          <p><strong>Catégorie :</strong> ${params.category}</p>
          <p><strong>Organisme :</strong> ${params.provider}</p>
          ${
            params.dueDate
              ? `<p><strong>Échéance :</strong> ${params.dueDate}</p>`
              : ''
          }
          <p>Merci de vous connecter à PeopleFlow pour consulter votre progression.</p>
        </div>
      `,
    };

    try {
      await sgMail.send(msg);
      this.logger.log(`Email de formation assignée envoyé à ${params.to}`);
    } catch (error) {
      this.logger.error(
        `Échec d’envoi à ${params.to}`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }
}
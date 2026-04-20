import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Employee } from '../employees/employee.entity';
import { LeaveRequest } from '../leaves/leave-request.entity';
import { Training } from '../trainings/training.entity';

type CurrentUser = {
  userId: number;
  email: string;
  role: string;
  employeeId: number | null;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,

    @InjectRepository(LeaveRequest)
    private readonly leaveRepo: Repository<LeaveRequest>,

    @InjectRepository(Training)
    private readonly trainingRepo: Repository<Training>,
  ) {}

  async getStats(currentUser: CurrentUser) {
    const isHrAdmin = currentUser.role === 'HR_ADMIN';
    const isManager = currentUser.role === 'MANAGER';
    const isEmployee = currentUser.role === 'EMPLOYEE';

    const trainings = await this.trainingRepo.find();

    if (isHrAdmin) {
      const employees = await this.employeeRepo.find({
        relations: ['department'],
        order: { createdAt: 'ASC' },
      });

      const leaves = await this.leaveRepo.find({
        relations: ['employee', 'employee.department', 'employee.manager'],
      });

      const activeEmployees = employees.filter(
        (employee) => employee.status === 'Active',
      );

      const departments = new Set(
        activeEmployees
          .map((employee) => employee.department?.name)
          .filter((name): name is string => !!name),
      ).size;

      const pendingLeaves = leaves.filter(
        (leave) => leave.status === 'Pending',
      ).length;

      return {
        scope: 'global',
        stats: {
          totalEmployees: activeEmployees.length,
          pendingLeaves,
          trainingHours: trainings.reduce(
            (sum, training) => sum + training.durationHours,
            0,
          ),
          departments,
        },
        chartMonths: this.buildChartMonths(),
        employeeTrend: this.buildEmployeeTrend(activeEmployees),
        profile: null,
        leaveSummary: null,
        leaveHistory: [],
      };
    }

    if (isManager) {
      if (!currentUser.employeeId) {
        return this.getEmptyDashboard('team');
      }

      const manager = await this.employeeRepo.findOne({
        where: { id: currentUser.employeeId },
        relations: ['teamMembers', 'teamMembers.department'],
      });

      if (!manager) {
        return this.getEmptyDashboard('team');
      }

      const teamMembers = manager.teamMembers.filter(
        (employee) => employee.status === 'Active',
      );

      const teamIds = teamMembers.map((employee) => employee.id);

      let leaves: LeaveRequest[] = [];

      if (teamIds.length > 0) {
        leaves = await this.leaveRepo
          .createQueryBuilder('leave')
          .leftJoinAndSelect('leave.employee', 'employee')
          .leftJoinAndSelect('employee.department', 'department')
          .leftJoinAndSelect('employee.manager', 'manager')
          .where('employee.id IN (:...ids)', { ids: teamIds })
          .getMany();
      }

      const departments = new Set(
        teamMembers
          .map((employee) => employee.department?.name)
          .filter((name): name is string => !!name),
      ).size;

      const pendingLeaves = leaves.filter(
        (leave) => leave.status === 'Pending',
      ).length;

      return {
        scope: 'team',
        stats: {
          totalEmployees: teamMembers.length,
          pendingLeaves,
          trainingHours: trainings.reduce(
            (sum, training) => sum + training.durationHours,
            0,
          ),
          departments,
        },
        chartMonths: this.buildChartMonths(),
        employeeTrend: this.buildEmployeeTrend(teamMembers),
        profile: null,
        leaveSummary: null,
        leaveHistory: [],
      };
    }

    if (isEmployee) {
      if (!currentUser.employeeId) {
        return this.getEmptyDashboard('personal');
      }

      const employee = await this.employeeRepo.findOne({
        where: { id: currentUser.employeeId },
        relations: ['department', 'manager'],
      });

      if (!employee) {
        return this.getEmptyDashboard('personal');
      }

      const employeeLeaves = await this.leaveRepo.find({
        where: {
          employee: {
            id: currentUser.employeeId,
          },
        },
        relations: ['employee', 'employee.department', 'employee.manager'],
        order: { id: 'DESC' },
      });

      const pendingLeaves = employeeLeaves.filter(
        (leave) => leave.status === 'Pending',
      ).length;

      const approvedLeaves = employeeLeaves.filter(
        (leave) => leave.status === 'Approved',
      ).length;

      const rejectedLeaves = employeeLeaves.filter(
        (leave) => leave.status === 'Rejected',
      ).length;

      const totalLeaves = employeeLeaves.length;

      const leaveHistory = employeeLeaves.slice(0, 5).map((leave) => ({
        id: leave.id,
        type: leave.type,
        status: leave.status,
        startDate: leave.startDate,
        endDate: leave.endDate,
        days: leave.days,
      }));

      return {
        scope: 'personal',
        stats: {
          totalEmployees: 1,
          pendingLeaves,
          trainingHours: trainings.reduce(
            (sum, training) => sum + training.durationHours,
            0,
          ),
          departments: employee.department?.name ? 1 : 0,
        },
        chartMonths: [],
        employeeTrend: [0, 0, 0, 0, 0, 0],
        profile: {
          fullName: `${employee.firstName} ${employee.lastName}`,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          position: employee.position,
          status: employee.status,
          departmentName: employee.department?.name ?? 'Non renseigné',
          managerName: employee.manager
            ? `${employee.manager.firstName} ${employee.manager.lastName}`
            : 'Aucun manager',
          photoUrl: employee.photoUrl ?? '',
          createdAt: employee.createdAt,
        },
        leaveSummary: {
          total: totalLeaves,
          pending: pendingLeaves,
          approved: approvedLeaves,
          rejected: rejectedLeaves,
        },
        leaveHistory,
      };
    }

    return this.getEmptyDashboard('unknown');
  }

  private getEmptyDashboard(scope: string) {
    return {
      scope,
      stats: {
        totalEmployees: 0,
        pendingLeaves: 0,
        trainingHours: 0,
        departments: 0,
      },
      chartMonths: [],
      employeeTrend: [0, 0, 0, 0, 0, 0],
      profile: null,
      leaveSummary: null,
      leaveHistory: [],
    };
  }

  private buildChartMonths(): string[] {
    const monthLabels: string[] = [];
    const formatter = new Intl.DateTimeFormat('fr-FR', { month: 'short' });
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = formatter.format(date).replace('.', '');
      monthLabels.push(label.charAt(0).toUpperCase() + label.slice(1));
    }

    return monthLabels;
  }

  private buildEmployeeTrend(employees: Employee[]): number[] {
    const monthEnds: Date[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      monthEnds.push(new Date(now.getFullYear(), now.getMonth() - i + 1, 0));
    }

    return monthEnds.map((monthEnd) => {
      return employees.filter((employee) => {
        if (!employee.createdAt) return false;
        const createdAt = new Date(employee.createdAt);
        return createdAt.getTime() <= monthEnd.getTime();
      }).length;
    });
  }
}
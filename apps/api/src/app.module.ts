import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { GeoModule } from './geo/geo.module';
import { CadreModule } from './cadre/cadre.module';
import { CommitteesModule } from './committees/committees.module';
import { CitizensModule } from './citizens/citizens.module';
import { GrievancesModule } from './grievances/grievances.module';
import { DirectoryModule } from './directory/directory.module';
import { SchemesModule } from './schemes/schemes.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { NotificationsModule } from './notifications/notifications.module';
import { EventsModule } from './events/events.module';
import { SurveysModule } from './surveys/surveys.module';
import { ProjectsModule } from './projects/projects.module';
import { GisModule } from './gis/gis.module';
import { AiModule } from './ai/ai.module';
import { ReportsModule } from './reports/reports.module';
import { ActivitiesModule } from './activities/activities.module';
import { AssetsModule } from './assets/assets.module';
import { UploadsModule } from './uploads/uploads.module';
import { D2dModule } from './d2d/d2d.module';
import { TempGrievancesModule } from './temp-grievances/temp-grievances.module';
import { ElectionModule } from './election/election.module';
import { VoterIntelligenceModule } from './voter-intelligence/voter-intelligence.module';
import { WarRoomModule } from './war-room/war-room.module';
import { AttendanceModule } from './attendance/attendance.module';
import { FundraisingModule } from './fundraising/fundraising.module';
import { ComplianceModule } from './compliance/compliance.module';
import { MediaModule } from './media/media.module';
import { PrManagementModule } from './pr-management/pr-management.module';
import { ManifestoModule } from './manifesto/manifesto.module';
import { CrisisModule } from './crisis/crisis.module';
import { DocumentsModule } from './documents/documents.module';
import { CallCenterModule } from './call-center/call-center.module';
import { DataQualityModule } from './data-quality/data-quality.module';
import { PublicPortalModule } from './public-portal/public-portal.module';
import { LeaderOfficeModule } from './leader-office/leader-office.module';
import { SecurityAuditModule } from './security-audit/security-audit.module';
import { OfflineSyncModule } from './offline-sync/offline-sync.module';
import { AdminModule } from './admin/admin.module';
import { BrandingModule } from './branding/branding.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { SecurityHeadersMiddleware } from './common/middleware/security.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    DashboardModule,
    GeoModule,
    CadreModule,
    CommitteesModule,
    CitizensModule,
    GrievancesModule,
    DirectoryModule,
    SchemesModule,
    WhatsappModule,
    NotificationsModule,
    EventsModule,
    SurveysModule,
    ProjectsModule,
    GisModule,
    AiModule,
    ReportsModule,
    ActivitiesModule,
    AssetsModule,
    UploadsModule,
    D2dModule,
    TempGrievancesModule,
    ElectionModule,
    VoterIntelligenceModule,
    WarRoomModule,
    AttendanceModule,
    FundraisingModule,
    ComplianceModule,
    MediaModule,
    PrManagementModule,
    ManifestoModule,
    CrisisModule,
    DocumentsModule,
    CallCenterModule,
    DataQualityModule,
    PublicPortalModule,
    LeaderOfficeModule,
    SecurityAuditModule,
    OfflineSyncModule,
    AdminModule,
    BrandingModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SecurityHeadersMiddleware, RateLimitMiddleware).forRoutes('*');
  }
}

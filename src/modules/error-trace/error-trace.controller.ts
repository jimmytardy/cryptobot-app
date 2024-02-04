import { Controller, Get, HttpException, Param, Post, Req, UseGuards } from '@nestjs/common'
import { ErrorTraceService } from './error-trace.service'
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard'

@Controller('error-trace')
@UseGuards(JwtAuthGuard)
export class ErrorTraceController {
    constructor(private errorTraceService: ErrorTraceService) {}

    @Get()
    findAll(@Req() req) {
        if (!req.user.isAdmin) throw new HttpException("Vous n'avez pas les droits pour accéder à cette ressource", 403)
        return this.errorTraceService.findAll({ finish: false }, 'functionName severity userId createdAt', {
            lean: true,
            sort: { createdAt: -1 },
            populate: {
                path: 'userId',
                select: 'firstname lastname',
            },
        })
    }

    @Get(':errorTraceId')
    findOne(@Req() req, @Param('errorTraceId') errorTraceId: string) {
        if (!req.user.isAdmin) throw new HttpException("Vous n'avez pas les droits pour accéder à cette ressource", 403)
        return this.errorTraceService.findOne({ _id: errorTraceId }, undefined, {
            lean: true,
            populate: {
                path: 'userId',
                select: 'firstname lastname email',
            },
        })
    }

    @Post(':errorTraceId/finish')
    finish(@Req() req, @Param('errorTraceId') errorTraceId: string) {
        if (!req.user.isAdmin) throw new HttpException("Vous n'avez pas les droits pour accéder à cette ressource", 403)
        return this.errorTraceService.markAsFinished(errorTraceId)
    }
}

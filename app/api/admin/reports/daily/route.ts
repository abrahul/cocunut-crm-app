import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Task from "@/models/Task";
import AdminSession from "@/models/AdminSession";
import { getAuthUser } from "@/lib/authServer";
import { getReportUnlock } from "@/lib/reportAuth";
import mongoose from "mongoose";

const ADMIN_SESSION_TIMEOUT_MS = 10 * 60 * 1000;

export async function GET(request: Request) {
  try {
    await connectDB();
    const auth = await getAuthUser();
    if (!auth || auth.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const reportUnlock = await getReportUnlock(auth.staffId);
    if (!reportUnlock || reportUnlock.scope !== "reports") {
      return NextResponse.json(
        { error: "Reports locked" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from")?.trim();
    const to = searchParams.get("to")?.trim();
    const staffId = searchParams.get("staffId")?.trim();
    const locationId = searchParams.get("locationId")?.trim();

    const match: Record<string, any> = {
      completedDate: { $ne: null },
    };
    const completedDateRange: Record<string, Date> = {};
    if (from) {
      const fromDate = new Date(`${from}T00:00:00.000Z`);
      if (!Number.isNaN(fromDate.getTime())) {
        completedDateRange.$gte = fromDate;
      }
    }
    if (to) {
      const toDate = new Date(`${to}T23:59:59.999Z`);
      if (!Number.isNaN(toDate.getTime())) {
        completedDateRange.$lte = toDate;
      }
    }
    if (Object.keys(completedDateRange).length > 0) {
      match.completedDate = {
        ...match.completedDate,
        ...completedDateRange,
      };
    }

    if (staffId && mongoose.Types.ObjectId.isValid(staffId)) {
      match.staff = new mongoose.Types.ObjectId(staffId);
    }

    if (locationId && mongoose.Types.ObjectId.isValid(locationId)) {
      match.location = new mongoose.Types.ObjectId(locationId);
    }

    const staleSessions = await AdminSession.find({
      logoutAt: null,
      lastActivityAt: { $lte: new Date(Date.now() - ADMIN_SESSION_TIMEOUT_MS) },
    })
      .select("_id lastActivityAt")
      .lean();

    if (staleSessions.length > 0) {
      await AdminSession.bulkWrite(
        staleSessions.map((session) => ({
          updateOne: {
            filter: { _id: session._id, logoutAt: null },
            update: {
              $set: {
                logoutAt: new Date(
                  new Date(session.lastActivityAt).getTime() + ADMIN_SESSION_TIMEOUT_MS
                ),
                logoutReason: "timeout",
              },
            },
          },
        }))
      );
    }

    const data = await Task.aggregate([
      { $match: match },
      {
        $facet: {
          daily: [
            {
              $group: {
                _id: {
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: "$completedDate",
                  },
                },
                totalTasks: { $sum: 1 },
                completedTasks: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                  },
                },
                pendingTasks: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
                  },
                },
                totalTrees: { $sum: "$numberOfTrees" },
                totalRevenue: { $sum: "$totalAmount" },
              },
            },
            { $sort: { _id: 1 } },
            {
              $project: {
                _id: 0,
                date: "$_id",
                totalTasks: 1,
                completedTasks: 1,
                pendingTasks: 1,
                totalTrees: 1,
                totalRevenue: 1,
              },
            },
          ],
          summary: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                completedTasks: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
                  },
                },
                pendingTasks: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
                  },
                },
                totalTrees: { $sum: "$numberOfTrees" },
                totalRevenue: { $sum: "$totalAmount" },
              },
            },
            {
              $project: {
                _id: 0,
                totalTasks: 1,
                completedTasks: 1,
                pendingTasks: 1,
                totalTrees: 1,
                totalRevenue: 1,
              },
            },
          ],
        },
      },
    ]);

    const payload = data?.[0] || { daily: [], summary: [] };
    const summary =
      payload.summary?.[0] || {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        totalTrees: 0,
        totalRevenue: 0,
      };

    const sessionMatch: Record<string, any> = {};
    if (from || to) {
      sessionMatch.loginAt = {};
      if (from) {
        const fromDate = new Date(`${from}T00:00:00.000Z`);
        if (!Number.isNaN(fromDate.getTime())) {
          sessionMatch.loginAt.$gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(`${to}T23:59:59.999Z`);
        if (!Number.isNaN(toDate.getTime())) {
          sessionMatch.loginAt.$lte = toDate;
        }
      }
      if (Object.keys(sessionMatch.loginAt).length === 0) {
        delete sessionMatch.loginAt;
      }
    }

    const adminSessions = await AdminSession.find(sessionMatch)
      .populate("admin", "username mobile")
      .sort({ loginAt: -1 })
      .lean();

    const sessionRows = adminSessions.map((session: any) => {
      const loginAt = session.loginAt ? new Date(session.loginAt) : null;
      const logoutAt = session.logoutAt ? new Date(session.logoutAt) : null;
      return {
        id: String(session._id),
        sessionName: session.sessionName || "-",
        date: loginAt ? loginAt.toISOString().slice(0, 10) : null,
        loginAt: loginAt ? loginAt.toISOString() : null,
        logoutAt: logoutAt ? logoutAt.toISOString() : null,
        logoutReason: session.logoutReason || null,
        adminName: session?.admin?.username || session?.admin?.mobile || "Admin",
      };
    });

    return NextResponse.json({
      summary,
      days: payload.daily || [],
      adminSessions: sessionRows,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

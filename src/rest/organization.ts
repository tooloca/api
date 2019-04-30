import { Organization } from "../interfaces/tables/organization";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganization
} from "../crud/organization";
import { InsertResult } from "../interfaces/mysql";
import {
  createMembership,
  deleteAllOrganizationMemberships
} from "../crud/membership";
import {
  MembershipRole,
  ErrorCode,
  EventType,
  Authorizations
} from "../interfaces/enum";
import { createEvent } from "../crud/event";
import { Locals } from "../interfaces/general";
import { can } from "../helpers/authorization";

export const getOrganizationForUser = async (
  userId: number,
  organizationId: number
) => {
  if (await can(userId, Authorizations.READ, "organization", organizationId))
    return await getOrganization(organizationId);
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const newOrganizationForUser = async (
  userId: number,
  organization: Organization,
  locals: Locals
) => {
  const org = <InsertResult>await createOrganization(organization);
  const organizationId = org.insertId;
  await createMembership({
    organizationId,
    userId,
    role: MembershipRole.OWNER
  });
  await createEvent(
    {
      userId,
      organizationId,
      type: EventType.ORGANIZATION_CREATED,
      data: { id: org.insertId }
    },
    locals
  );
  return;
};

export const updateOrganizationForUser = async (
  userId: number,
  organizationId: number,
  data: Organization,
  locals: Locals
) => {
  if (
    await can(userId, Authorizations.UPDATE, "organization", organizationId)
  ) {
    await updateOrganization(organizationId, data);
    await createEvent(
      {
        userId,
        organizationId,
        type: EventType.ORGANIZATION_UPDATED,
        data: { id: organizationId, data }
      },
      locals
    );
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

export const deleteOrganizationForUser = async (
  userId: number,
  organizationId: number,
  locals: Locals
) => {
  if (
    await can(userId, Authorizations.DELETE, "organization", organizationId)
  ) {
    await deleteOrganization(organizationId);
    await deleteAllOrganizationMemberships(organizationId);
    await createEvent(
      {
        userId,
        organizationId,
        type: EventType.ORGANIZATION_DELETED,
        data: { id: organizationId }
      },
      locals
    );
    return;
  }
  throw new Error(ErrorCode.INSUFFICIENT_PERMISSION);
};

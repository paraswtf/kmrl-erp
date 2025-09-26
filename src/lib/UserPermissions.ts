import BitField from "./BitField";
import type { BitFieldResolvable } from "./BitField";

/**
 * Data structure that makes it easy to interact with a bitfield.
 */
export class UserPermissions extends BitField<
	keyof typeof UserPermissions.Flags
> {
	public static Flags = {
		SUPERADMIN: 1 << 0,
		//USERS
		USERS_VIEW: 1 << 1,
		USERS_UPDATE: 1 << 2,
		//GROUPS
		GROUPS_CREATE: 1 << 3,
		GROUPS_READ: 1 << 4,
		GROUPS_UPDATE: 1 << 5,
		GROUPS_DELETE: 1 << 6,
		//ROLES
		ROLES_CREATE: 1 << 7,
		ROLES_READ: 1 << 8,
		ROLES_UPDATE: 1 << 9,
		ROLES_DELETE: 1 << 10,
	} as const;

	public Flags = UserPermissions.Flags;

	public readonly DefaultBit = 0;
}

export type PermissionsResolvable = BitFieldResolvable<
	keyof typeof UserPermissions.Flags
>;

export default UserPermissions;

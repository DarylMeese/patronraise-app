/** Global config injected by WordPress via wp_localize_script */
export interface PatronRaiseAppConfig {
	apiBase: string;
	nonce: string;
	siteUrl: string;
}

declare global {
	interface Window {
		patronraiseApp: PatronRaiseAppConfig;
	}
}

/** Auth / User */
export interface User {
	user_id: string;
	email: string;
	name: string;
	avatar: string | null;
	isNetworkAdmin: boolean;
}

/** Organization */
export interface Organization {
	organizationId: string;
	name: string;
	displayName: string;
	type: string;
}

/** Event */
export interface EventOccurrence {
	id: number;
	publicUid: string;
	eventId: number;
	startAt: string;
	endAt: string;
	timezone: string;
	isAllDay: number;
}

export interface ActionLink {
	id: number;
	eventId: number;
	linkType: 'tickets' | 'rsvp' | 'donation' | 'info' | 'other';
	label: string;
	url: string;
	isPrimary: number;
	displayOrder: number;
}

export interface EventOrganization {
	organizationId: string;
	role: string;
	displayName?: string;
	name?: string;
}

export interface Event {
	id: number;
	publicUid: string;
	source: string;
	sourceAuthoritative: number;
	title: string;
	description: string;
	eventKind: string;
	status: string;
	primaryOwnerOrganizationId: string;
	createdByUserId: string;
	occurrences: EventOccurrence[];
	actionLinks: ActionLink[];
	organizations?: EventOrganization[];
	createdAt: string;
	updatedAt: string;
}

/** Offer */
export interface OfferAvailability {
	availabilityId: number;
	fundraiserHostOfferId: number;
	dayOfWeek: number;
	startTime: string;
	endTime: string;
	capacityRules: unknown;
	monthsOfYear: number[] | null;
	createdAt: string;
	updatedAt: string;
}

export interface Offer {
	fundraiserHostOfferId: number;
	publicUid: string;
	hostOrganizationId: string;
	title: string;
	summary: string;
	terms: string;
	givebackType: 'percent' | 'fixed';
	givebackValue: string;
	givebackCap: string;
	leadTimeDaysMin: number;
	minRsvp: number;
	status: 'draft' | 'published' | 'archived';
	availabilities: OfferAvailability[];
	createdAt: string;
	updatedAt: string;
}

export interface OfferFormData {
	title: string;
	description?: string;
	percentageSplit?: number;
	terms?: string;
	status?: 'draft' | 'active' | 'archived';
	availabilities?: {
		dayOfWeek: number;
		startTime: string;
		endTime: string;
		monthsOfYear?: number[];
	}[];
}

/** Date Override */
export interface DateOverride {
	overrideId: number;
	fundraiserHostOfferId: number;
	date: string;
	status: 'open' | 'closed';
	startTime: string | null;
	endTime: string | null;
	reason: string;
	createdAt: string;
	updatedAt: string;
}

/** Availability Day */
export interface AvailabilityDay {
	date: string;
	status: 'open' | 'closed';
	slots: { start: string; end: string }[];
}

/** Campaign */
export interface Campaign {
	campaignId: string;
	publicUid: string;
	tenantId: string;
	beneficiaryOrganizationId: string;
	name: string;
	goalAmount: string | null;
	raisedAmount: string;
	startAt: string;
	endAt: string;
	status: 'draft' | 'active' | 'completed' | 'cancelled';
	meta: unknown;
	createdAt: string;
	updatedAt: string;
}

/** Partnership */
export type PartnershipState =
	| 'pending_host_approval'
	| 'pending_beneficiary_approval'
	| 'approved'
	| 'declined'
	| 'changes_requested'
	| 'cancelled';

export interface FundraisingEventDetails {
	eventId: number;
	campaignId: string | null;
	offerId: number | null;
	partnershipState: PartnershipState;
	proposedTerms: unknown;
	requestedByUserId: string;
	approvedByUserId: string | null;
	approvedAt: string | null;
	rejectionReason: string | null;
	createdAt: string;
	updatedAt: string;
}

/** Report */
export interface EventReport {
	reportId: number;
	eventId: number;
	totalParticipants: number;
	verifiedParticipants: number;
	totalReceiptsUploaded: number;
	selfReportedSpendTotal: string;
	hostReportedTotal: string | null;
	hostReportedGiveback: string | null;
	internalNotes: string;
	summaryJson: unknown;
	finalizedAt: string | null;
	finalizedByUserId: string | null;
	createdAt: string;
	updatedAt: string;
}

/** Participation */
export interface Participation {
	participationId: number;
	eventId: number;
	endUserId: string | null;
	participationMode: 'unverified' | 'verified';
	isVerified: number;
	selfReportedSpend: string | null;
	optedOutOfSharing: number;
	checkinMethod: 'qr_code' | 'staff_code' | 'manual' | null;
	checkinCode: string | null;
	checkinAt: string | null;
	createdAt: string;
}

/** API List Response */
export interface ListResponse<T> {
	items: T[];
}

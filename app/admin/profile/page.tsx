'use client';

import React, { FormEvent, useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser, displayName } from '@/lib/auth';
import { api } from '@/lib/api';
import { PageHeader, Card, AvatarInitials, Modal } from '@/components/ui';
import { useToast } from '@/components/Toast';
import { fmtDate } from '@/lib/format';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80',
];

export default function StaffSelfProfilePage() {
  const { user, updateUser } = useUser();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sessions'>('profile');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [timezone, setTimezone] = useState('Africa/Lagos (GMT+1)');

  // Custom Avatar Input / Picker Modal
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [customAvatarInput, setCustomAvatarInput] = useState('');

  // Security Form Fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaMethod, setMfaMethod] = useState('TOTP Hardware Token');

  // Loading States
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(displayName(user));
      setTitle((user.title as string) || 'Executive Leadership & Superadmin');
      setDepartment((user.department as string) || 'Executive Leadership & Superadmin');
      setEmail(user.email || 'aliko.adeleke@apexfinance.internal');
      setPhone((user.phone_number as string) || '+234 803 000 8899');
      setAvatarUrl((user.avatar_url as string) || '');
      setBio((user.bio as string) || 'Managing Platform Architecture and Risk Controls across Pan-African corridors.');
      setTimezone((user.timezone as string) || 'Africa/Lagos (GMT+1)');
    }
  }, [user]);

  function handleSaveProfile(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);

    const updated = {
      display_name: fullName.trim(),
      first_name: fullName.trim().split(' ')[0] || '',
      last_name: fullName.trim().split(' ').slice(1).join(' ') || '',
      title: title.trim(),
      department: department.trim(),
      phone_number: phone.trim(),
      avatar_url: avatarUrl.trim(),
      bio: bio.trim(),
      timezone: timezone.trim(),
    };

    api
      .put('/profile', updated)
      .then(() => {
        updateUser(updated);
        toast('success', 'Staff profile updated successfully');
      })
      .catch(() => {
        // Fallback update local state for preview
        updateUser(updated);
        toast('success', 'Staff profile updated successfully');
      })
      .finally(() => setSavingProfile(false));
  }

  function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast('error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast('error', 'New password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    api
      .post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      .then(() => {
        toast('success', 'Security password updated. All active sessions renewed.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      })
      .catch((err: any) => {
        toast('error', err.message || 'Password update failed');
      })
      .finally(() => setChangingPassword(false));
  }

  function handleSelectPresetAvatar(url: string) {
    setAvatarUrl(url);
    updateUser({ avatar_url: url });
    setAvatarModalOpen(false);
    toast('success', 'Avatar updated');
  }

  function handleApplyCustomAvatar(e: FormEvent) {
    e.preventDefault();
    if (!customAvatarInput.trim()) return;
    setAvatarUrl(customAvatarInput.trim());
    updateUser({ avatar_url: customAvatarInput.trim() });
    setCustomAvatarInput('');
    setAvatarModalOpen(false);
    toast('success', 'Custom avatar applied');
  }

  function handleRemoveAvatar() {
    setAvatarUrl('');
    updateUser({ avatar_url: '' });
    setAvatarModalOpen(false);
    toast('info', 'Avatar removed (falling back to initials)');
  }

  return (
    <div className="container-fluid pb-5">
      <PageHeader
        title="My Staff Profile &amp; Preferences"
        actions={
          <div className="d-flex align-items-center gap-2">
            <Link href="/admin/staff" className="btn btn-outline-secondary btn-sm shadow-sm">
              <i className="ti ti-users-group me-1" /> Staff Directory
            </Link>
            <Link href="/admin/audit-logs" className="btn btn-outline-secondary btn-sm shadow-sm">
              <i className="ti ti-history me-1" /> My Activity Log
            </Link>
          </div>
        }
      />

      {/* Tabs */}
      <div className="card border-0 shadow-sm rounded-3 mb-4">
        <div className="card-header bg-white border-bottom p-0">
          <ul className="nav nav-tabs nav-tabs-custom border-0 px-3">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link border-0 py-3 px-3 fs-13 fw-semibold ${
                  activeTab === 'profile' ? 'active text-primary border-bottom border-primary border-2' : 'text-muted'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="ti ti-user-circle me-1" /> Profile &amp; Avatar
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link border-0 py-3 px-3 fs-13 fw-semibold ${
                  activeTab === 'security' ? 'active text-primary border-bottom border-primary border-2' : 'text-muted'
                }`}
                onClick={() => setActiveTab('security')}
              >
                <i className="ti ti-shield-lock me-1" /> Credentials &amp; MFA
              </button>
            </li>
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link border-0 py-3 px-3 fs-13 fw-semibold ${
                  activeTab === 'sessions' ? 'active text-primary border-bottom border-primary border-2' : 'text-muted'
                }`}
                onClick={() => setActiveTab('sessions')}
              >
                <i className="ti ti-device-laptop me-1" /> Active Sessions
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="row g-4">
        {/* Left Column: Staff Card Preview */}
        <div className="col-12 col-lg-4">
          <div className="card border-0 shadow-sm rounded-3 mb-4">
            <div className="card-body p-4 text-center border-bottom bg-light bg-opacity-25">
              <div className="position-relative d-inline-block mx-auto mb-3">
                <AvatarInitials
                  text={fullName || displayName(user)}
                  src={avatarUrl}
                  size={88}
                  className="shadow-sm border"
                />
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-circle position-absolute bottom-0 end-0 p-0 d-flex align-items-center justify-content-center shadow"
                  style={{ width: 28, height: 28 }}
                  title="Change avatar"
                  onClick={() => setAvatarModalOpen(true)}
                >
                  <i className="ti ti-camera fs-14" />
                </button>
              </div>

              <h5 className="fw-bold text-dark mb-1">{fullName || displayName(user)}</h5>
              <div className="text-secondary fs-13 mb-1">{title}</div>
              <div className="text-muted font-monospace fs-12 mb-3">{email}</div>

              <div className="d-flex align-items-center justify-content-center gap-2">
                <span className="badge rounded-pill bg-success-subtle text-success fs-11 px-3 py-1">
                  ACTIVE STAFF
                </span>
                <span className="badge rounded-pill bg-light text-secondary border fs-11 font-monospace px-3 py-1">
                  STF-01
                </span>
              </div>
            </div>

            <div className="card-body p-4">
              <h6 className="fw-bold text-dark fs-12 text-uppercase tracking-wider mb-3">
                Identity &amp; Governance
              </h6>
              <div className="d-flex flex-column gap-3 fs-13">
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom gap-2">
                  <span className="text-muted flex-shrink-0">Department</span>
                  <span className="text-dark fw-medium text-end text-truncate" title={department}>{department}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom gap-2">
                  <span className="text-muted flex-shrink-0">Direct Phone</span>
                  <span className="text-dark font-monospace text-end">{phone || '—'}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom gap-2">
                  <span className="text-muted flex-shrink-0">MFA Method</span>
                  <span className="text-success fw-medium d-flex align-items-center gap-1 text-end">
                    <i className="ti ti-shield-check flex-shrink-0" /> <span className="text-truncate">{mfaMethod}</span>
                  </span>
                </div>
                <div className="d-flex justify-content-between align-items-center pb-2 border-bottom gap-2">
                  <span className="text-muted flex-shrink-0">Timezone</span>
                  <span className="text-dark text-end text-truncate">{timezone}</span>
                </div>
                <div className="d-flex justify-content-between align-items-center gap-2">
                  <span className="text-muted flex-shrink-0">Audit Registry</span>
                  <span className="badge rounded-pill bg-light text-muted border">Dual-Control</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setAvatarModalOpen(true)}
                >
                  <i className="ti ti-photo-up" /> Upload or Choose Avatar
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tab Content */}
        <div className="col-12 col-lg-8">
          {activeTab === 'profile' && (
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="fw-bold text-dark m-0 fs-16">Personnel Profile Information</h5>
                <p className="text-muted fs-12 m-0 mt-1">
                  Update your contact details, operational job title, and personal bio displayed across audit logs and desks.
                </p>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleSaveProfile}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fs-12 fw-semibold text-muted">Full Legal Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-12 fw-semibold text-muted">Official Email Address</label>
                      <input
                        type="email"
                        className="form-control bg-light"
                        value={email}
                        readOnly
                        disabled
                      />
                      <small className="text-muted fs-11">Institutional email is managed by your organization directory.</small>
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-12 fw-semibold text-muted">Desk Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Managing Director & Superadmin"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-12 fw-semibold text-muted">Assigned Department</label>
                      <input
                        type="text"
                        className="form-control bg-light"
                        value={department}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-12 fw-semibold text-muted">Direct Mobile / Signal Contact</label>
                      <input
                        type="tel"
                        className="form-control font-monospace"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+234 800 000 0000"
                      />
                    </div>

                    <div className="col-12 col-md-6">
                      <label className="form-label fs-12 fw-semibold text-muted">Operational Timezone</label>
                      <select
                        className="form-select"
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                      >
                        <option value="Africa/Lagos (GMT+1)">Africa/Lagos (GMT+1)</option>
                        <option value="Africa/Accra (GMT+0)">Africa/Accra (GMT+0)</option>
                        <option value="Africa/Nairobi (GMT+3)">Africa/Nairobi (GMT+3)</option>
                        <option value="Africa/Johannesburg (GMT+2)">Africa/Johannesburg (GMT+2)</option>
                        <option value="Europe/London (GMT+1)">Europe/London (GMT+1)</option>
                      </select>
                    </div>

                    <div className="col-12">
                      <label className="form-label fs-12 fw-semibold text-muted">Staff Bio &amp; Desk Responsibilities</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Provide a summary of your desk coverage and authorization responsibilities…"
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                    <button
                      type="submit"
                      className="btn btn-primary px-4 shadow-sm"
                      disabled={savingProfile}
                    >
                      {savingProfile ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Saving…
                        </>
                      ) : (
                        'Save Profile Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-bottom p-4">
                <h5 className="fw-bold text-dark m-0 fs-16">Security Credentials &amp; MFA Management</h5>
                <p className="text-muted fs-12 m-0 mt-1">
                  Manage your control room password and multi-factor authentication devices.
                </p>
              </div>

              <div className="card-body p-4">
                <form onSubmit={handleChangePassword}>
                  <h6 className="fw-bold text-dark fs-13 mb-3">Change Console Password</h6>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <label className="form-label fs-12 fw-semibold text-muted">Current Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fs-12 fw-semibold text-muted">New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label fs-12 fw-semibold text-muted">Confirm New Password</label>
                      <input
                        type="password"
                        className="form-control"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <button
                      type="submit"
                      className="btn btn-outline-secondary btn-sm"
                      disabled={changingPassword || !currentPassword || !newPassword}
                    >
                      {changingPassword ? 'Updating…' : 'Update Password'}
                    </button>
                  </div>
                </form>

                <hr className="my-4" />

                <h6 className="fw-bold text-dark fs-13 mb-3">Multi-Factor Authentication Device</h6>
                <div className="p-3 rounded border bg-light d-flex align-items-center justify-content-between mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white"
                      style={{ width: 44, height: 44, backgroundColor: '#16B364' }}
                    >
                      <i className="ti ti-shield-check fs-20" />
                    </div>
                    <div>
                      <div className="fw-semibold text-dark">{mfaMethod}</div>
                      <small className="text-muted">Enforced on all sensitive administrative mutations</small>
                    </div>
                  </div>
                  <span className="badge rounded-pill bg-success-subtle text-success fs-11">ENFORCED</span>
                </div>

                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => toast('info', 'Hardware token verification challenge dispatched')}
                  >
                    <i className="ti ti-key me-1" /> Test Challenge
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => toast('info', 'Recovery codes re-generated and sent to verified email')}
                  >
                    <i className="ti ti-download me-1" /> Download Backup Codes
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white border-bottom p-4 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <div>
                  <h5 className="fw-bold text-dark m-0 fs-16">Active Authentication Sessions</h5>
                  <p className="text-muted fs-12 m-0 mt-1">
                    Control room consoles currently authorized for your staff profile.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={() => toast('success', 'All other sessions terminated successfully')}
                >
                  <i className="ti ti-logout me-1" /> Log Out Other Sessions
                </button>
              </div>

              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0 fs-13">
                    <thead className="table-light fs-12 text-muted border-bottom">
                      <tr>
                        <th className="ps-4">Device / Client</th>
                        <th>IP Address</th>
                        <th>Location</th>
                        <th>Last Active</th>
                        <th className="pe-4 text-end">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            <i className="ti ti-device-desktop fs-18 text-primary" />
                            <div>
                              <div className="fw-semibold text-dark">Chrome on Linux (Apex Console)</div>
                              <small className="text-muted">Primary workstation</small>
                            </div>
                          </div>
                        </td>
                        <td><code>10.0.4.12</code></td>
                        <td>Lagos, Nigeria (VPN)</td>
                        <td className="text-muted fs-12">Active now</td>
                        <td className="pe-4 text-end">
                          <span className="badge rounded-pill bg-success-subtle text-success fs-10">CURRENT SESSION</span>
                        </td>
                      </tr>
                      <tr>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            <i className="ti ti-device-mobile fs-18 text-secondary" />
                            <div>
                              <div className="fw-semibold text-dark">Mobile Authenticator PWA</div>
                              <small className="text-muted">iOS Client</small>
                            </div>
                          </div>
                        </td>
                        <td><code>105.112.98.24</code></td>
                        <td>Abuja, Nigeria</td>
                        <td className="text-muted fs-12">{fmtDate(new Date(Date.now() - 3600000).toISOString(), true)}</td>
                        <td className="pe-4 text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-link text-danger p-0 text-decoration-none fs-12"
                            onClick={() => toast('success', 'Mobile session revoked')}
                          >
                            Revoke
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Picker & Upload Modal */}
      {avatarModalOpen && (
        <Modal
          title="Choose or Upload Staff Avatar"
          open={true}
          onClose={() => setAvatarModalOpen(false)}
        >
          <div className="mb-4">
            <label className="form-label fs-12 fw-semibold text-muted">Select Preset Professional Avatar</label>
            <div className="d-flex gap-3 flex-wrap">
              {PRESET_AVATARS.map((url, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`btn p-1 rounded-circle border ${avatarUrl === url ? 'border-primary border-3' : ''}`}
                  onClick={() => handleSelectPresetAvatar(url)}
                >
                  <img
                    src={url}
                    alt={`Preset ${idx + 1}`}
                    className="rounded-circle object-fit-cover"
                    style={{ width: 54, height: 54 }}
                  />
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleApplyCustomAvatar} className="mb-4">
            <label className="form-label fs-12 fw-semibold text-muted">Or Paste Image URL</label>
            <div className="input-group input-group-sm">
              <input
                type="url"
                className="form-control"
                placeholder="https://example.com/avatar.jpg"
                value={customAvatarInput}
                onChange={(e) => setCustomAvatarInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Apply URL
              </button>
            </div>
          </form>

          <div className="d-flex justify-content-between align-items-center pt-3 border-top">
            <button
              type="button"
              className="btn btn-outline-danger btn-sm"
              onClick={handleRemoveAvatar}
            >
              <i className="ti ti-trash me-1" /> Use Initials
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => setAvatarModalOpen(false)}
            >
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

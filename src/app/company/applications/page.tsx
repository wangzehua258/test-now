"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface Application {
  id: number;
  student: {
    id: number;
    name: string;
    email: string;
    university: string;
    major: string;
    graduation_year: number;
    skills: string[];
    bio: string | null;
    resume_path: string | null;
    user?: {
      id: number;
    };
  };
  internship: {
    id: number;
    title: string;
  };
  application: {
    cover_letter: string;
    resume_path: string | null;
    portfolio_url: string | null;
  };
  student_status: 'applied' | 'interviewing' | 'offered' | 'rejected';
  company_status: 'pending' | 'send interview invitation' | 'interviewing' | 'reviewing' | 'accepted' | 'rejected';
  created_at: string;
}

interface DecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: Application['company_status'], notes: string) => void;
  currentStatus: Application['company_status'];
}

function DecisionModal({ isOpen, onClose, onConfirm, currentStatus }: DecisionModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<Application['company_status']>(currentStatus);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm(selectedStatus, notes);
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-opacity-25 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
        {!showConfirmation ? (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Move Application to Next Step</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Step</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as Application['company_status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="send interview invitation">Send Interview Invitation</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Decision Notes (Required)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={4}
                  placeholder="Please provide a brief explanation for this decision..."
                  required
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  Continue
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Status Change</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Are you sure you want to move this application to:</p>
              <p className="font-medium text-gray-900 mb-4">{selectedStatus.replace(/_/g, ' ').toUpperCase()}</p>
              <p className="text-sm text-gray-600 mb-2">With the following notes:</p>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">{notes}</p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 ${
                  isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isSubmitting ? 'Processing...' : 'Confirm Change'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function CompanyApplications() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<{ id: number; status: Application['company_status'] } | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      const response = await axios.get(`${API_URL}/api/company/applications`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      setApplications(response.data.data);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: number, newStatus: Application['company_status'], notes: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Please log in to update application status');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';
      await axios.put(
        `${API_URL}/api/company/applications/${applicationId}/status`,
        { 
          company_status: newStatus,
          decision_notes: notes 
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
      );

      // If status is "send interview invitation", send a message to the student
      if (newStatus === 'send interview invitation') {
        const application = applications.find(app => app.id === applicationId);
        if (application?.student?.user?.id) {
          try {
            await axios.post(
              `${API_URL}/api/company/messages`,
              {
                receiver_id: application.student.user.id,
                receiver_role: 'student',
                content: `You have received an interview invitation for the ${application.internship.title} position. Please check your application status and respond accordingly.`
              },
              {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              }
            );
          } catch (error) {
            console.error('Failed to send notification message:', error);
          }
        }
      }

      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, company_status: newStatus } : app
      ));
    } catch (err) {
      console.error('Error updating status:', err);
      if (axios.isAxiosError(err) && err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError(err instanceof Error ? err.message : 'Failed to update status');
      }
    }
  };

  const getStatusColor = (status: Application['company_status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'send interview invitation':
        return 'bg-blue-100 text-blue-800';
      case 'interviewing':
        return 'bg-purple-100 text-purple-800';
      case 'reviewing':
        return 'bg-indigo-100 text-indigo-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg font-semibold">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage and review applications for your internship positions
          </p>
        </div>

        {applications.length === 0 ? (
          <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900">No applications yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                When students apply for your internships, they will appear here.
              </p>
            </div>
          </div>
        ) : (
          <ul role="list" className="space-y-4">
            {applications.map((application) => (
              <li
                key={application.id}
                onClick={() => router.push(`/company/applications/${application.id}`)}
                className="bg-white shadow rounded-lg cursor-pointer hover:shadow-md transition-shadow duration-200"
              >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-medium text-gray-900 truncate">
                        {application.student.name}
                      </h2>
                      <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                          {application.student.email}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {application.student.university}
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          {application.student.major}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(application.company_status)}`}>
                        {application.company_status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedApplication({ id: application.id, status: application.company_status });
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        Move to Next Step
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedApplication && (
        <DecisionModal
          isOpen={!!selectedApplication}
          onClose={() => setSelectedApplication(null)}
          onConfirm={(status, notes) => handleStatusUpdate(selectedApplication.id, status, notes)}
          currentStatus={selectedApplication.status}
        />
      )}
    </div>
  );
}

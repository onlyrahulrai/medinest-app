import { useState, useCallback, useRef } from 'react';
import InvitationService from '../services/api/invitation';
import { userApi } from '../services/api/userApi';
import RelationService from '@/services/api/relation';

export function useCaregivers() {
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCaregivers = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await InvitationService.getInvitations();
      setData(result || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, refetch: fetchCaregivers, setData };
}

export function useAddCaregiver() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const addCaregiver = async (payload: { caregiverName: string; caregiverPhone: string; relation: string }) => {
    setIsSubmitting(true);
    try {
      const result = await InvitationService.createInvitation(payload);
      return result;
    } catch (error: any) {
      throw error?.response?.data || error;
    } finally {
      setIsSubmitting(false);
    }
  };
  return { addCaregiver, isSubmitting };
}

export function useUpdateCaregiver() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateCaregiver = async (id: string, payload: any) => {
    setIsSubmitting(true);
    try {
      const result = await RelationService.updateRelation(id, payload);
      return result;
    } catch (error: any) {
      throw error?.response?.data || error;
    } finally {
      setIsSubmitting(false);
    }
  };
  return { updateCaregiver, isSubmitting };
}

export function useDeleteCaregiver() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deleteCaregiver = async (id: string) => {
    setIsSubmitting(true);
    try {
      const result = await InvitationService.deleteInvitation(id);
      return result;
    } catch (error: any) {
      throw error?.response?.data || error;
    } finally {
      setIsSubmitting(false);
    }
  };
  return { deleteCaregiver, isSubmitting };
}

export function useRespondInvitation() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const respondInvitation = async (id: string, status: 'accepted' | 'rejected') => {
    setIsSubmitting(true);
    try {
      const result = await InvitationService.respondToInvitation(id, status);
      return result;
    } catch (error: any) {
      throw error?.response?.data || error;
    } finally {
      setIsSubmitting(false);
    }
  };
  return { respondInvitation, isSubmitting };
}

export function useCheckUserExists() {
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [existsName, setExistsName] = useState("");
  const [isLookupLoading, setIsLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const checkUser = useCallback((phone: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!phone || phone.length < 10) {
      setIsExistingUser(false);
      setExistsName("");
      return;
    }
    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await userApi.checkUserExists(phone);
        // Map any truthy values implying structural existence
        setIsExistingUser(!!(result?.found || result?.exists || result?.id || result?._id || result?.userId));
        setExistsName(result?.name || "");
      } catch (err) {
        setIsExistingUser(false);
        setExistsName("");
      } finally {
        setIsLoading(false);
      }
    }, 500);
  }, []);

  return { checkUser, isExistingUser, existsName, isLookupLoading };
}

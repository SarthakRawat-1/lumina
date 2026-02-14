import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { JobEnrichmentResponse } from '@/lib/jobsApi';

interface JobEnrichmentsState {
    byJobId: Record<string, JobEnrichmentResponse>;
}

const initialState: JobEnrichmentsState = {
    byJobId: {},
};

const jobEnrichmentsSlice = createSlice({
    name: 'jobEnrichments',
    initialState,
    reducers: {
        cacheEnrichment: (state, action: PayloadAction<{ jobId: string; data: JobEnrichmentResponse }>) => {
            state.byJobId[action.payload.jobId] = action.payload.data;
        },
        clearEnrichments: (state) => {
            state.byJobId = {};
        },
    },
});

export const { cacheEnrichment, clearEnrichments } = jobEnrichmentsSlice.actions;
export default jobEnrichmentsSlice.reducer;

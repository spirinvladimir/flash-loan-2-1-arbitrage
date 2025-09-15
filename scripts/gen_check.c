#include <float.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <inttypes.h>
#include <string.h>
#include <stdbool.h>

#define PROGRESS(curr, total) do { \
    int p = (curr * 40) / total; \
    printf("\r[%.*s%*s] %d%%", p, "########################################", 40-p, "", (curr*100)/total); \
    fflush(stdout); \
} while(0)

#define POOLS_COUNT 452063
#define MAX_COMBS 1000000

int end = -1;
int pools[POOLS_COUNT];
int token0[POOLS_COUNT];
int token1[POOLS_COUNT];

int get_pool(int A, int B, int* t2ps_count, int** t2ps, int** tt2p) {
    for (int i = 0; i < t2ps_count[A]; i++)
        if (tt2p[A][i] == B)
            return t2ps[A][i];
    return -1;
}

int main() {
    printf("Loading pools and it's tokens\n");

    FILE* file = fopen("p2tt_452063.bin", "rb");
    int it;
    int ip;
    int max_it = 0;
    for (ip = 0; ip < POOLS_COUNT; ip++) {
        int _[2];
        size_t items_read = fread(_, sizeof(int32_t), 2, file);
        pools[ip] = ip;
        token0[ip] = _[0];
        token1[ip] = _[1];
        if (token0[ip] > max_it) max_it = token0[ip];
        if (token1[ip] > max_it) max_it = token1[ip];
        PROGRESS(ip, POOLS_COUNT);
    }
    PROGRESS(POOLS_COUNT, POOLS_COUNT);
    fclose(file);

    int** t2ps = malloc((max_it + 1) * sizeof(int*));
    int** tt2p = malloc((max_it + 1) * sizeof(int*));
    int t2ps_count[max_it + 1];

    FILE *ft2pt = fopen("t2pt.bin", "rb");
    if (ft2pt) {
        printf("\n\nFile t2pt.bin exists. Loading relations for tokens...\n");
        for (it = 0; it <= max_it; it++) {
            fread(&t2ps_count[it], sizeof(int), 1, ft2pt);
            t2ps[it] = malloc(t2ps_count[it] * sizeof(int));
            tt2p[it] = malloc(t2ps_count[it] * sizeof(int));
            for (int i = 0; i < t2ps_count[it]; i++) {
                fread(&t2ps[it][i], sizeof(int), 1, ft2pt);
                fread(&tt2p[it][i], sizeof(int), 1, ft2pt);
            }
            PROGRESS(it, max_it);
        }
        PROGRESS(max_it, max_it);
        fclose(ft2pt);
    } else {
        FILE* ft2pt = fopen("t2pt.bin", "wb");
        printf("\n\nCounting pools for each token\n");
        for (it = 0; it <= max_it; it++) {
            t2ps_count[it] = 0;
            for(ip = 0; ip < POOLS_COUNT; ip++)
                if (token0[ip] == it || token1[ip] == it)
                    t2ps_count[it]++;
            PROGRESS(it, max_it);
        }
        PROGRESS(max_it, max_it);


        printf("\n\nMapping token to pools\n");
        for (it = 0; it <= max_it; it++) {
            t2ps[it] = malloc(t2ps_count[it] * sizeof(int));
            tt2p[it] = malloc(t2ps_count[it] * sizeof(int));
            int i = 0;
            fwrite(&t2ps_count[it], sizeof(int), 1, ft2pt);
            for(ip = 0; ip < POOLS_COUNT; ip++)
                if (token0[ip] == it) {
                    t2ps[it][i] = ip;
                    fwrite(&ip, sizeof(int), 1, ft2pt);
                    tt2p[it][i] = token1[ip];
                    fwrite(&token1[ip], sizeof(int), 1, ft2pt);
                    i++;
                } else if (token1[ip] == it) {
                    t2ps[it][i] = ip;
                    fwrite(&ip, sizeof(int), 1, ft2pt);
                    tt2p[it][i] = token0[ip];
                    fwrite(&token0[ip], sizeof(int), 1, ft2pt);
                    i++;
                }
            PROGRESS(it, max_it);
        }
        PROGRESS(max_it, max_it);
    }

    FILE *fcombs = fopen("combs.bin", "rb");
    if (!fcombs) {
        fcombs = fopen("combs.bin", "wb");
        int size = 2;
        for (ip = 0; ip < POOLS_COUNT; ip++) {
            fwrite(&size, sizeof(int), 1, fcombs);
            fwrite(&token0[ip], sizeof(int), 1, fcombs);
            fwrite(&token1[ip], sizeof(int), 1, fcombs);
        }
        fwrite(&end, sizeof(int), 1, fcombs);
    }
    fclose(fcombs);

    int start_it = 0;
    FILE *fcurrent_token = fopen("current_token.bin", "rb");
    if (fcurrent_token) {
        fread(&start_it, sizeof(int), 1, fcurrent_token);
        printf("Continue from: %d%%\n", start_it * 100 / max_it);
    }

    for (it = start_it; it <= max_it; it++) {
        int C = it;
        FILE *fcombs = fopen("combs.bin", "rb");
        FILE *fcheck = fopen("check.bin", "wb");
        while (true) {
            int comb_size;
            fread(&comb_size, sizeof(int), 1, fcombs);
            if (comb_size == end) break;
            int comb[comb_size];
            fread(comb, sizeof(int), comb_size, fcombs);
            for (int i = 0, A, B; i < comb_size; i++) {
                A = comb[i];
                B = comb[(i + 1) % comb_size];
                if (A == C || B == C) break;
                if (
                    get_pool(A, C, t2ps_count, t2ps, tt2p) &&
                    get_pool(B, C, t2ps_count, t2ps, tt2p)
                ) {
                    int new_comb_size = comb_size + 1;
                    fwrite(&new_comb_size, sizeof(int), 1, fcheck);
                    for (int j = 0; j < comb_size; j++) {
                        fwrite(&comb[j], sizeof(int), 1, fcheck);
                        if (j == i) fwrite(&C, sizeof(int), 1, fcheck);
                    }
                }
            }


        }
        return 0;
        PROGRESS(it, max_it);
    }


/*
    printf("\n\nLoad combinations with 2 tokens\n");
    int combs_size[MAX_COMBS];
    int** combs = malloc(MAX_COMBS * sizeof(int*));
    int ic = 0;
    for (ip = 0; ip < POOLS_COUNT; ip++) {
        combs[ic] = malloc(2 * sizeof(int));
        combs[ic][0] = token0[ip];
        combs[ic][1] = token1[ip];
        combs_size[ic] = 2;
        ic++;
        PROGRESS(ip, POOLS_COUNT);
    }
    PROGRESS(POOLS_COUNT, POOLS_COUNT);

    int max_ic = ic - 1;
    printf("\n\nExtend combinations with tokens\n");
    int c3 = 0;
    for (it = 0; it <= max_it; it++) {
        int C = it;
        for (ic = 0; ic <= max_ic; ic++) {
            int size = combs_size[ic];
            for (int i = 0; i < size; i++) {
                int A = combs[ic][i];
                int B = combs[ic][(i + 1) % size];
                if (
                    get_pool(A, B, t2ps_count, t2ps, tt2p) != -1 &&
                    get_pool(B, C, t2ps_count, t2ps, tt2p) != -1
                ) combs_size[ic]++;
            }
        }
        PROGRESS(it, max_it);
    }
    PROGRESS(max_it, max_it);

    //FILE *output_file = fopen("combs.", "wb");
    //fwrite(&roi, 8, 1, output_file);
    //fclose(output_file);

    free(combs);

*/
    return 0;
}

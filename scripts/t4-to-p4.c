#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#define POOLS_COUNT 452063
#define MAX_COMBS 1000000
#define PROGRESS(curr, total) do { \
    int p = (curr * 40) / total; \
    printf("\r[%.*s%*s] %d%%", p, "########################################", 40-p, "", (curr*100)/total); \
    fflush(stdout); \
} while(0)
int end = -1;
int pools[POOLS_COUNT];
int token0[POOLS_COUNT];
int token1[POOLS_COUNT];
int main() {

    FILE* fp2tt = fopen("p2tt_452063.bin", "rb");
    int it;
    int ip;
    int max_it = 0;
    for (ip = 0; ip < POOLS_COUNT; ip++) {
        int _[2];
        fread(_, sizeof(int32_t), 2, fp2tt);
        pools[ip] = ip;
        token0[ip] = _[0];
        token1[ip] = _[1];
        if (token0[ip] > max_it) max_it = token0[ip];
        if (token1[ip] > max_it) max_it = token1[ip];
        PROGRESS(ip, POOLS_COUNT);
    }
    PROGRESS(POOLS_COUNT, POOLS_COUNT);
    fclose(fp2tt);

    int** t2ps = malloc((max_it + 1) * sizeof(int*));
    int** tt2p = malloc((max_it + 1) * sizeof(int*));
    int t2ps_count[max_it + 1];

    FILE *ft2pt = fopen("t2pt.bin", "rb");
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

    FILE* fi = fopen("4_tokens.bin", "rb");
    FILE* fo = fopen("4_pools.bin", "wb");
    int max = 500000;
    int a[max];
    int n = 0;
    int exist;
    int end = -1;
    int A, B, C, D;
    int AB = -1, BD = -1, CD = -1, AC = -1;
    while (1) {
        fread(&A, sizeof(int), 1, fi);if (A == end) break;
        fread(&B, sizeof(int), 1, fi);
        fread(&C, sizeof(int), 1, fi);
        fread(&D, sizeof(int), 1, fi);
        int i;
        for (i = 0; i < t2ps_count[A]; i++) {
            if (tt2p[A][i] == B) {
                AB = t2ps[A][i];
                if (AC != -1) break;
            } else if (tt2p[A][i] == C) {
                AC = t2ps[A][i];
                if (AB != -1) break;
            }
        }
        for (i = 0; i < t2ps_count[D]; i++) {
            if (tt2p[D][i] == B) {
                BD = t2ps[D][i];
                if (CD != -1) break;
            } else if (tt2p[A][i] == C) {
                CD = t2ps[A][i];
                if (BD != -1) break;
            }
        }
        fwrite(&AB, sizeof(int), 1, fo);
        fwrite(&BD, sizeof(int), 1, fo);
        fwrite(&CD, sizeof(int), 1, fo);
        fwrite(&AC, sizeof(int), 1, fo);
        printf("%d %d %d %d\n", AB, BD, CD, AC);

    }
    fwrite(&end, sizeof(int), 1, fo);
    fclose(fi);
    fclose(fo);
    printf("Total unique: %d.\nSaved at unique_tokens_4.bin\n", n);
    return 0;
}

#include <float.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <inttypes.h>
#include <string.h>

#define PROGRESS(curr, total) do { \
    int p = (curr * 40) / total; \
    printf("\r[%.*s%*s] %d%%", p, "########################################", 40-p, "", (curr*100)/total); \
    fflush(stdout); \
} while(0)


int end = -1;
int *aave_indexes = NULL;
int aave_count = 0;

int main() {
    FILE *fin = fopen("aave_tokens_indexes.bin", "rb");
    fread(&aave_count, sizeof(int), 1, fin);
    aave_indexes = malloc(aave_count * sizeof(int));
    fread(aave_indexes, sizeof(int), aave_count, fin);
    fclose(fin);
    printf("Loaded %d AAVE token indexes\n", aave_count);

    FILE *f3 = fopen("address_mapping/2_pools.bin", "rb");
    fseek(f3, 0, SEEK_END);
    long f3_size = ftell(f3);
    int total = f3_size / (3 * sizeof(int));
    fseek(f3, 0, SEEK_SET);
    int (*combs3)[3] = malloc(total * sizeof(int[3]));
    fread(combs3, sizeof(int[3]), total, f3);
    fclose(f3);
    int filtered_count = 0;
    FILE *fout = fopen("address_mapping/2_pools_filtered_aave.bin", "wb");
    for (int i = 0; i < total - 1; i++) {
        int A = combs3[i][0];
        int B = combs3[i][1];
        int C = combs3[i][2];

        int is_aave_token = 0;
        for (int j = 0; j < aave_count; j++) {
            if (aave_indexes[j] == A || aave_indexes[j] == C) {
                is_aave_token = 1;
                break;
            }
        }

        if (is_aave_token) {
            filtered_count++;
            fwrite(&A, sizeof(int), 1, fout);
            fwrite(&B, sizeof(int), 1, fout);
            fwrite(&C, sizeof(int), 1, fout);
            printf("[%d, %d, %d],", A, B, C);
        }
    }
    fwrite(&end, sizeof(int), 1, fout);
    fclose(fout);
    printf("Total combs after AAVE filter : %d", filtered_count);
    free(aave_indexes);

    return 0;
}
